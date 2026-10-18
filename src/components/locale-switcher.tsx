"use client";

import { localeLabels } from "@/i18n/messages";
import { useI18n } from "@/i18n/use-i18n";
import { LOCALES } from "@/lib/types";
import { cn } from "cn";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-0.5" aria-label={t.language}>
      {LOCALES.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setLocale(id)}
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium tracking-wide",
            locale === id
              ? "bg-primary text-primary-foreground"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          {localeLabels[id]}
        </button>
      ))}
    </div>
  );
}
