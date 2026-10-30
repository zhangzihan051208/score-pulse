"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "cn";

export function CommentBody({
  body,
  bodyOriginal,
  className,
}: {
  body: string;
  bodyOriginal?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);
  const translated =
    Boolean(bodyOriginal?.trim()) && bodyOriginal!.trim() !== body.trim();

  if (!body.trim()) return null;

  return (
    <div className={cn(className)}>
      <p className="leading-6">{showOriginal && translated ? bodyOriginal : body}</p>
      {translated ? (
        <button
          type="button"
          className="mt-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowOriginal((v) => !v)}
        >
          {showOriginal ? t.social.showTranslation : t.social.showOriginal}
        </button>
      ) : null}
    </div>
  );
}
