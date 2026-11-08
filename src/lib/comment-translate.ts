import type { CommunityTake } from "@/lib/community-take-types";
import { guessCommentLocale, shouldTranslate } from "@/lib/comment-locale";
import { createServiceClient } from "@/lib/supabase/server";
import { isBenignSupabaseSchemaError } from "@/lib/service-degraded";
import { LOCALES, type Locale } from "@/lib/types";

export { guessCommentLocale, shouldTranslate };

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 12_000;
const MAX_TRANSLATE_PER_REQUEST = 24;
const TRANSLATE_CONCURRENCY = 6;
const FAIL_CACHE_MS = 60_000;

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  ja: "Japanese",
  de: "German",
};

export type LocalizedCommentText = {
  body: string;
  /** Set when `body` is a translation of the stored comment text. */
  bodyOriginal?: string;
};

export type CommentTranslateRow = {
  id: string;
  body: string;
  user_id?: string;
  body_translations?: unknown;
};

function parseTranslations(raw: unknown): Partial<Record<Locale, string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<Locale, string>> = {};
  for (const loc of LOCALES) {
    const v = (raw as Record<string, unknown>)[loc];
    if (typeof v === "string" && v.trim()) out[loc] = v.trim();
  }
  return out;
}

const memoryTranslations = new Map<string, { value: string | null; expires: number }>();
const inflightTranslations = new Map<string, Promise<string | null>>();

function memoryKey(locale: Locale, body: string) {
  return `${locale}\n${body}`;
}

function readMemory(locale: Locale, body: string): string | null | undefined {
  const hit = memoryTranslations.get(memoryKey(locale, body));
  if (!hit) return undefined;
  if (hit.expires && hit.expires < Date.now()) {
    memoryTranslations.delete(memoryKey(locale, body));
    return undefined;
  }
  return hit.value;
}

function writeMemory(locale: Locale, body: string, value: string | null) {
  memoryTranslations.set(memoryKey(locale, body), {
    value,
    expires: value ? 0 : Date.now() + FAIL_CACHE_MS,
  });
}

async function translateWithOpenAi(
  body: string,
  targetLocale: Locale,
): Promise<string | null> {
  const trimmed = body.trim().slice(0, 2000);
  if (!trimmed) return null;
  const cached = readMemory(targetLocale, trimmed);
  if (cached !== undefined) return cached;
  const pending = inflightTranslations.get(memoryKey(targetLocale, trimmed));
  if (pending) return pending;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const job = requestOpenAiTranslation(trimmed, targetLocale, key);
  inflightTranslations.set(memoryKey(targetLocale, trimmed), job);
  return job.finally(() => {
    inflightTranslations.delete(memoryKey(targetLocale, trimmed));
  });
}

async function requestOpenAiTranslation(
  trimmed: string,
  targetLocale: Locale,
  key: string,
): Promise<string | null> {

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You translate short sports fan comments. Keep player and team names unchanged. Output only the translation with no quotes or explanation.",
          },
          {
            role: "user",
            content: `Translate to ${LOCALE_LABEL[targetLocale]}:\n\n${trimmed}`,
          },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      writeMemory(targetLocale, trimmed, null);
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = data.choices?.[0]?.message?.content?.trim() || null;
    writeMemory(targetLocale, trimmed, out);
    return out;
  } catch {
    writeMemory(targetLocale, trimmed, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Translate the texts that are not already in the viewer language. Null means unchanged. */
export async function translateBodies(
  bodies: string[],
  viewerLocale: Locale,
): Promise<(string | null)[]> {
  const out: (string | null)[] = bodies.map(() => null);
  const pending = bodies
    .map((body, index) => ({ body, index }))
    .filter((row) => shouldTranslate(row.body, viewerLocale))
    .slice(0, MAX_TRANSLATE_PER_REQUEST);

  for (let i = 0; i < pending.length; i += TRANSLATE_CONCURRENCY) {
    const slice = pending.slice(i, i + TRANSLATE_CONCURRENCY);
    await Promise.all(
      slice.map(async (row) => {
        out[row.index] = await translateWithOpenAi(row.body, viewerLocale);
      }),
    );
  }
  return out;
}

/** Translate editorial or other comments that are not stored as account rows. */
export async function localizePlainBodies<T extends { body?: string }>(
  rows: T[],
  viewerLocale: Locale,
): Promise<(T & { bodyOriginal?: string })[]> {
  const translated = await translateBodies(
    rows.map((row) => row.body ?? ""),
    viewerLocale,
  );
  return rows.map((row, index) => {
    const next = translated[index];
    const original = row.body ?? "";
    if (!next || next === original) return row;
    return { ...row, body: next, bodyOriginal: original };
  });
}

async function persistTranslation(
  commentId: string,
  cache: Partial<Record<Locale, string>>,
  locale: Locale,
  translated: string,
) {
  const admin = createServiceClient();
  if (!admin) return;
  const next = { ...cache, [locale]: translated };
  const { error } = await admin
    .from("comments")
    .update({ body_translations: next })
    .eq("id", commentId);
  if (error?.message && !isBenignSupabaseSchemaError(error.message)) {
    /* column missing on old schema — still served translated for this response */
  }
}

/**
 * Resolve display text for each comment id for the viewer locale.
 * Authors always see their own original text. Results are cached in Supabase when possible.
 */
export async function localizeCommentBodies(
  rows: CommentTranslateRow[],
  viewerLocale: Locale,
  viewerUserId?: string,
): Promise<Map<string, LocalizedCommentText>> {
  const out = new Map<string, LocalizedCommentText>();
  const pending: CommentTranslateRow[] = [];

  for (const row of rows) {
    const original = row.body ?? "";
    if (viewerUserId && row.user_id === viewerUserId) {
      out.set(row.id, { body: original });
      continue;
    }
    if (!shouldTranslate(original, viewerLocale)) {
      out.set(row.id, { body: original });
      continue;
    }

    const cache = parseTranslations(row.body_translations);
    const cached = cache[viewerLocale];
    if (cached) {
      out.set(row.id, {
        body: cached,
        bodyOriginal: cached === original ? undefined : original,
      });
      continue;
    }

    pending.push(row);
  }

  const translated = await translateBodies(
    pending.map((row) => row.body ?? ""),
    viewerLocale,
  );
  pending.forEach((row, index) => {
    const original = row.body ?? "";
    const next = translated[index];
    if (!next || next === original) {
      out.set(row.id, { body: original });
      return;
    }
    out.set(row.id, { body: next, bodyOriginal: original });
    void persistTranslation(
      row.id,
      parseTranslations(row.body_translations),
      viewerLocale,
      next,
    );
  });

  return out;
}

export function applyLocalizedBody(
  map: Map<string, LocalizedCommentText>,
  commentId: string | undefined,
  fallback: string,
): LocalizedCommentText {
  if (!commentId) return { body: fallback };
  return map.get(commentId) ?? { body: fallback };
}

export function attachTranslationToTakes(
  takes: CommunityTake[],
  localized: Map<string, LocalizedCommentText>,
): CommunityTake[] {
  return takes.map((t) => {
    const top = t.commentId ? localized.get(t.commentId) : undefined;
    return {
      ...t,
      body: top?.body ?? t.body,
      bodyOriginal: top?.bodyOriginal,
      replies: t.replies?.map((r) => {
        const loc = localized.get(r.id);
        return loc
          ? { ...r, body: loc.body, bodyOriginal: loc.bodyOriginal }
          : r;
      }),
    };
  });
}
