"use client";

import { localeLabels } from "@/i18n/messages";
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
        className="h-7 rounded-md border border-white/20 bg-[#1f1f1f] px-1.5 text-xs font-medium text-white outline-none hover:border-white/40 focus-visible:ring-2 focus-visible:ring-primary"
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
