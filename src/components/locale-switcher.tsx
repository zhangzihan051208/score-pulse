"use client";

import { localeLabels } from "@/i18n/locale-labels";
import { useI18n } from "@/i18n/use-i18n";
import { LOCALES, type Locale } from "@/lib/types";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex h-8 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2 text-xs font-medium text-black">
      <span className="hidden sm:inline">{t.language}</span>
      <select
        aria-label={t.language}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-full bg-transparent pr-1 text-xs font-medium text-black outline-none"
        style={{ colorScheme: "light" }}
      >
        {LOCALES.map((id) => (
          <option key={id} value={id} className="bg-white text-black">
            {localeLabels[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
