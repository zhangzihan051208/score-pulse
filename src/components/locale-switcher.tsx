"use client";

import { localeLabels } from "@/i18n/locale-labels";
import { useI18n } from "@/i18n/use-i18n";
import { LOCALES, type Locale } from "@/lib/types";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-1.5 text-xs text-white/70">
      <span className="hidden sm:inline">{t.language}</span>
      <select
        aria-label={t.language}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-8 rounded-lg border border-white/15 bg-white/8 px-2 text-xs font-medium text-white outline-none hover:border-white/35 focus-visible:ring-2 focus-visible:ring-primary/80"
      >
        {LOCALES.map((id) => (
          <option key={id} value={id}>
            {localeLabels[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
