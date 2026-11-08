import type { CommunityTake } from "@/lib/community-take-types";
import { guessCommentLocale, shouldTranslate } from "@/lib/comment-locale";
import {
  parseTranslationBatch,
  translationBodyHash,
} from "@/lib/comment-translate-batch";
import { createServiceClient } from "@/lib/supabase/server";
import { isBenignSupabaseSchemaError } from "@/lib/service-degraded";
import { LOCALES, type Locale } from "@/lib/types";

export { guessCommentLocale, shouldTranslate };

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 20_000;
const MAX_TRANSLATE_PER_REQUEST = 24;
const BATCH_SIZE = 20;
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

async function readDurable(
  locale: Locale,
  bodies: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const admin = createServiceClient();
  if (!admin || bodies.length === 0) return found;
  const hashes = [...new Set(bodies.map((body) => translationBodyHash(body)))];
  const { data, error } = await admin
    .from("translation_cache")
    .select("body_hash, translated")
    .eq("locale", locale)
    .in("body_hash", hashes);
  if (error) return found;
  for (const row of data ?? []) {
    if (typeof row.body_hash === "string" && typeof row.translated === "string" && row.translated.trim()) {
      found.set(row.body_hash, row.translated.trim());
    }
  }
  return found;
}

async function writeDurable(
  locale: Locale,
  pairs: { body: string; translated: string }[],
) {
  const admin = createServiceClient();
  if (!admin || pairs.length === 0) return;
  const rows = pairs.map((pair) => ({
    locale,
    body_hash: translationBodyHash(pair.body),
    source: pair.body,
    translated: pair.translated,
  }));
  const { error } = await admin
    .from("translation_cache")
    .upsert(rows, { onConflict: "locale,body_hash" });
  if (error?.message && !isBenignSupabaseSchemaError(error.message)) {
    /* table missing until migrate-translation-cache.sql — this response still returns the text */
  }
}

async function requestOpenAiBatch(
  bodies: string[],
  targetLocale: Locale,
  key: string,
): Promise<(string | null)[] | null> {
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
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You translate short sports fan comments into ${LOCALE_LABEL[targetLocale]}. Keep player and team names unchanged. Reply with JSON {"items":[...]} with exactly one string per input item, in the same order.`,
          },
          {
            role: "user",
            content: JSON.stringify({ items: bodies }),
          },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    return parseTranslationBatch(raw, bodies.length);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function remember(locale: Locale, body: string, value: string | null) {
  writeMemory(locale, body, value);
}

function trackTranslation(locale: Locale, body: string, job: Promise<string | null>) {
  const key = memoryKey(locale, body);
  const tracked = job.finally(() => {
    inflightTranslations.delete(key);
  });
  inflightTranslations.set(key, tracked);
  return tracked;
}

/** Translate the texts that are not already in the viewer language. Null means unchanged. */
export async function translateBodies(
  bodies: string[],
  viewerLocale: Locale,
): Promise<(string | null)[]> {
  const out: (string | null)[] = bodies.map(() => null);
  const trimmed = bodies.map((body) => body.trim().slice(0, 2000));
  const waiting: Promise<string | null>[] = [];
  const needed: string[] = [];
  const seen = new Set<string>();

  for (const body of trimmed) {
    if (!shouldTranslate(body, viewerLocale) || seen.has(body)) continue;
    seen.add(body);
    if (readMemory(viewerLocale, body) !== undefined) continue;
    const pending = inflightTranslations.get(memoryKey(viewerLocale, body));
    if (pending) {
      waiting.push(pending);
      continue;
    }
    needed.push(body);
  }
  if (waiting.length > 0) await Promise.all(waiting);

  const queue = needed
    .filter((body) => readMemory(viewerLocale, body) === undefined)
    .slice(0, MAX_TRANSLATE_PER_REQUEST);
  const durable = await readDurable(viewerLocale, queue);
  const misses: string[] = [];
  for (const body of queue) {
    const hit = durable.get(translationBodyHash(body));
    if (hit) {
      remember(viewerLocale, body, hit);
      continue;
    }
    misses.push(body);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey && misses.length > 0) {
    const jobs: Promise<unknown>[] = [];
    for (let i = 0; i < misses.length; i += BATCH_SIZE) {
      const chunk = misses.slice(i, i + BATCH_SIZE);
      const batch = requestOpenAiBatch(chunk, viewerLocale, apiKey);
      chunk.forEach((body, index) => {
        jobs.push(
          trackTranslation(
            viewerLocale,
            body,
            batch.then((translated) => {
              const next = translated?.[index] ?? null;
              const ok = Boolean(next && next !== body);
              remember(viewerLocale, body, ok ? next : null);
              return ok ? next : null;
            }),
          ),
        );
      });
      jobs.push(
        batch.then(async (translated) => {
          if (!translated) return;
          const stored = chunk.flatMap((body, index) => {
            const next = translated[index];
            return next && next !== body ? [{ body, translated: next }] : [];
          });
          await writeDurable(viewerLocale, stored);
        }),
      );
    }
    await Promise.all(jobs);
  }

  for (let index = 0; index < trimmed.length; index += 1) {
    const body = trimmed[index] ?? "";
    if (!shouldTranslate(body, viewerLocale)) continue;
    const cached = readMemory(viewerLocale, body);
    if (typeof cached === "string") out[index] = cached;
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
