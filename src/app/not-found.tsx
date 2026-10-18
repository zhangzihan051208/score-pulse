"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.notFound.body}</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary">
        {t.notFound.back}
      </Link>
    </div>
  );
}
