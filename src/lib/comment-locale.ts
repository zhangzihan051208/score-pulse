import type { Locale } from "@/lib/types";

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

export function shouldTranslate(body: string, viewerLocale: Locale): boolean {
  const trimmed = body.trim();
  if (trimmed.length < 2 || trimmed === "—") return false;
  const guessed = guessCommentLocale(trimmed);
  if (guessed && guessed === viewerLocale) return false;
  return true;
}
