"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { localeLabels } from "@/i18n/locale-labels";
import type { Locale } from "@/lib/types";
import { cn } from "cn";

export function CommentBody({
  body,
  bodyOriginal,
  bodyLocale,
  isTranslated,
  className,
}: {
  body: string;
  bodyOriginal?: string;
  bodyLocale?: Locale;
  isTranslated?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);

  if (!body.trim()) return null;

  const canToggle =
    isTranslated && bodyOriginal && bodyOriginal.trim() !== body.trim();

  const display = canToggle && showOriginal ? bodyOriginal : body;

  return (
    <div className={cn("space-y-1", className)}>
      <p className="leading-relaxed whitespace-pre-wrap">{display}</p>
      {canToggle ? (
        <p className="text-[11px] text-muted-foreground">
          <span>
            {t.rate.translatedFrom.replace(
              "{lang}",
              bodyLocale ? localeLabels[bodyLocale] : "…",
            )}
          </span>
          {" · "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowOriginal((v) => !v)}
          >
            {showOriginal ? t.rate.showTranslation : t.rate.showOriginal}
          </button>
        </p>
      ) : null}
    </div>
  );
}
