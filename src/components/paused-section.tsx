"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";

export function PausedSection() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg px-3 py-16 text-center">
      <h1 className="text-2xl font-bold">{t.common.pausedTitle}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.common.pausedBody}</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        ← {t.nav.home}
      </Link>
    </div>
  );
}
