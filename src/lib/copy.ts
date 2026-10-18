import type { Locale, Localized } from "./types";

export function tx(copy: Localized, locale: Locale) {
  return copy[locale] || copy.en;
}

export const L = (
  en: string,
  zh: string,
  es: string,
  ja: string,
): Localized => ({ en, zh, es, ja });
