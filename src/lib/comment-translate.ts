import type { CommunityTake } from "@/lib/community-take-types";
import { createServiceClient } from "@/lib/supabase/server";
import { isBenignSupabaseSchemaError } from "@/lib/service-degraded";
import { LOCALES, type Locale } from "@/lib/types";

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 12_000;
const MAX_TRANSLATE_PER_REQUEST = 10;

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

/** Rough source locale so we skip translating when the viewer already matches. */
export function guessCommentLocale(text: string): Locale | null {
  const t = text.trim();
  if (!t) return null;
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(t)) return "ja";
  if (/[\u4e00-\u9fff]/.test(t)) return "zh";
  if (/[äöüß]/i.test(t)) return "de";
  if (/[¿¡ñáéíóú]/i.test(t)) return "es";
  if (/[a-zA-Z]/.test(t)) return "en";
  return null;
}

function shouldTranslate(body: string, viewerLocale: Locale): boolean {
  const trimmed = body.trim();
  if (trimmed.length < 2 || trimmed === "—") return false;
  const guessed = guessCommentLocale(trimmed);
  if (guessed && guessed === viewerLocale) return false;
  return true;
}

async function translateWithOpenAi(
  body: string,
  targetLocale: Locale,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

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
            content: `Translate to ${LOCALE_LABEL[targetLocale]}:\n\n${body.slice(0, 2000)}`,
          },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = data.choices?.[0]?.message?.content?.trim();
    return out || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  let translatedCount = 0;

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

    if (translatedCount >= MAX_TRANSLATE_PER_REQUEST) {
      out.set(row.id, { body: original });
      continue;
    }

    const translated = await translateWithOpenAi(original, viewerLocale);
    translatedCount += 1;
    if (!translated || translated === original) {
      out.set(row.id, { body: original });
      continue;
    }

    out.set(row.id, { body: translated, bodyOriginal: original });
    void persistTranslation(row.id, cache, viewerLocale, translated);
  }

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
