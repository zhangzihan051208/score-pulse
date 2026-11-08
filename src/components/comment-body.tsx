"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { shouldTranslate } from "@/lib/comment-locale";
import { requestTranslation } from "@/lib/translate-queue";
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
  const { locale, t } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);
  const [auto, setAuto] = useState<string | null>(null);
  const serverTranslated =
    Boolean(bodyOriginal?.trim()) && bodyOriginal!.trim() !== body.trim();

  useEffect(() => {
    setShowOriginal(false);
    if (serverTranslated || !body.trim() || !shouldTranslate(body, locale)) {
      setAuto(null);
      return;
    }
    let cancel = false;
    requestTranslation(body, locale).then((next) => {
      if (!cancel) setAuto(next);
    });
    return () => {
      cancel = true;
    };
  }, [body, locale, serverTranslated]);

  if (!body.trim()) return null;

  const translated = serverTranslated || Boolean(auto && auto !== body);
  const original = serverTranslated ? bodyOriginal : body;
  const shown = showOriginal ? original : serverTranslated ? body : (auto ?? body);

  return (
    <div className={cn(className)}>
      <p className="leading-6">{shown}</p>
      {translated ? (
        <button
          type="button"
          className="mt-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setShowOriginal((v) => !v);
          }}
        >
          {showOriginal ? t.social.showTranslation : t.social.showOriginal}
        </button>
      ) : null}
    </div>
  );
}

/** One visible line, such as a hot take on the roster or spotlight. */
export function TranslatedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { locale } = useI18n();
  const [value, setValue] = useState(text);

  useEffect(() => {
    if (!shouldTranslate(text, locale)) {
      setValue(text);
      return;
    }
    let cancel = false;
    requestTranslation(text, locale).then((next) => {
      if (!cancel && next) setValue(next);
    });
    return () => {
      cancel = true;
    };
  }, [text, locale]);

  return <p className={className}>{value}</p>;
}
