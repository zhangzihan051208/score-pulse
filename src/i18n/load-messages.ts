import type { Locale } from "@/lib/types";
import type { Dict } from "@/i18n/dict";
import en from "@/i18n/catalog/en";

const cache: Partial<Record<Locale, Dict>> = {
  en,
};

const loaders: Record<Locale, () => Promise<{ default: Dict }>> = {
  en: () => import("@/i18n/catalog/en"),
  zh: () => import("@/i18n/catalog/zh"),
  es: () => import("@/i18n/catalog/es"),
  ja: () => import("@/i18n/catalog/ja"),
  de: () => import("@/i18n/catalog/de"),
};

export function getMessagesSync(locale: Locale): Dict | undefined {
  return cache[locale];
}

export async function loadMessages(locale: Locale): Promise<Dict> {
  const hit = cache[locale];
  if (hit) return hit;
  const mod = await loaders[locale]();
  cache[locale] = mod.default;
  return mod.default;
}
