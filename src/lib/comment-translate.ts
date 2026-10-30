import { createServiceClient } from "@/lib/supabase/server";
import { LOCALES, type Locale } from "@/lib/types";

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 12_000;

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  zh: "Simplified Chinese",
  es: "Spanish",
  ja: "Japanese",
  de: "German",
};

/** Rough source language for fan comments (no extra API call). */
export function detectCommentLocale(text: string): Locale {
  const t = text.trim();
  if (!t) return "en";
  if (/[\u3040-\u30ff]/.test(t)) return "ja";
  if (/[\u4e00-\u9fff]/.test(t)) return "zh";
  if (/[äöüßÄÖÜ]/.test(t) || /\b(und|der|die|das|nicht|schon|auch)\b/i.test(t)) {
    return "de";
  }
  if (/[ñ¿¡]/.test(t) || /\b(el|la|los|que|pero|muy)\b/i.test(t)) return "es";
  return "en";
}

export type CommentTranslationRow = {
  id: string;
  body: string;
  body_locale?: string | null;
  translations?: Record<string, string> | null;
};

export type LocalizedCommentBody = {
  body: string;
  bodyOriginal?: string;
  bodyLocale?: Locale;
  isTranslated: boolean;
};

function asLocale(value: string | null | undefined): Locale | undefined {
  if (value && (LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return undefined;
}

async function translateWithOpenAi(
  text: string,
  source: Locale,
  target: Locale,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || source === target) return null;

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
              "You translate sports fan comments for a global audience. Keep player, club, and venue names as commonly used in the target language. Preserve tone (casual, passionate). Output only the translation, no quotes or notes.",
          },
          {
            role: "user",
            content: `Translate from ${LOCALE_NAMES[source]} to ${LOCALE_NAMES[target]}:\n\n${text.slice(0, 2000)}`,
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
  sourceLocale: Locale,
  targetLocale: Locale,
  translated: string,
  existing: Record<string, string>,
) {
  const admin = createServiceClient();
  if (!admin) return;
  const translations = { ...existing, [targetLocale]: translated };
  await admin
    .from("comments")
    .update({
      body_locale: sourceLocale,
      translations,
    })
    .eq("id", commentId);
}

/** Resolve comment text for the viewer's UI language. */
export async function localizeCommentBody(
  row: CommentTranslationRow,
  viewerLocale: Locale,
  opts?: { persist?: boolean },
): Promise<LocalizedCommentBody> {
  const original = row.body?.trim() ?? "";
  if (!original) {
    return { body: "", isTranslated: false };
  }

  const source =
    asLocale(row.body_locale) ?? detectCommentLocale(original);

  if (source === viewerLocale) {
    return { body: original, bodyLocale: source, isTranslated: false };
  }

  const translations = row.translations ?? {};
  const cached = translations[viewerLocale]?.trim();
  if (cached) {
    return {
      body: cached,
      bodyOriginal: original,
      bodyLocale: source,
      isTranslated: true,
    };
  }

  const translated = await translateWithOpenAi(original, source, viewerLocale);
  if (!translated) {
    return { body: original, bodyLocale: source, isTranslated: false };
  }

  if (opts?.persist !== false && row.id) {
    await persistTranslation(row.id, source, viewerLocale, translated, translations);
  }

  return {
    body: translated,
    bodyOriginal: original,
    bodyLocale: source,
    isTranslated: true,
  };
}

const DEFAULT_NEW_TRANSLATIONS_PER_REQUEST = 14;

/** Batch-localize comment rows; caps new OpenAI calls per HTTP request. */
export async function localizeCommentsForViewer(
  rows: CommentTranslationRow[],
  viewerLocale: Locale,
  maxNewTranslations = DEFAULT_NEW_TRANSLATIONS_PER_REQUEST,
): Promise<Map<string, LocalizedCommentBody>> {
  const out = new Map<string, LocalizedCommentBody>();
  let budget = maxNewTranslations;

  for (const row of rows) {
    const original = row.body?.trim() ?? "";
    if (!original) {
      out.set(row.id, { body: "", isTranslated: false });
      continue;
    }

    const source =
      asLocale(row.body_locale) ?? detectCommentLocale(original);

    if (source === viewerLocale) {
      out.set(row.id, { body: original, bodyLocale: source, isTranslated: false });
      continue;
    }

    const translations = row.translations ?? {};
    const cached = translations[viewerLocale]?.trim();
    if (cached) {
      out.set(row.id, {
        body: cached,
        bodyOriginal: original,
        bodyLocale: source,
        isTranslated: true,
      });
      continue;
    }

    if (budget <= 0) {
      out.set(row.id, { body: original, bodyLocale: source, isTranslated: false });
      continue;
    }

    budget -= 1;
    const localized = await localizeCommentBody(row, viewerLocale, { persist: true });
    out.set(row.id, localized);
  }

  return out;
}

export function commentLocaleForInsert(body: string): Locale {
  return detectCommentLocale(body);
}
