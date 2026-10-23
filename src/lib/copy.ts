import type { Locale, Localized } from "./types";

export function tx(copy: Localized, locale: Locale) {
  return copy[locale] || copy.en;
}

export const L = (
  en: string,
  zh: string,
  es: string,
  ja: string,
  de = en,
): Localized => ({ en, zh, es, ja, de });

/** Same copy in every locale (live API names). */
export const S = (text: string): Localized => ({
  en: text,
  zh: text,
  es: text,
  ja: text,
  de: text,
});
