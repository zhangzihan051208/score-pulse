"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";
import { operatorName, supportEmail } from "@/lib/operator";

export default function PrivacyPage() {
  const { t } = useI18n();
  const operator = operatorName();
  const email = supportEmail();
  const paragraphs = [
    t.privacy.intro,
    t.privacy.collect,
    t.privacy.use,
    t.privacy.store,
    t.privacy.delete,
    t.privacy.contact,
  ];

  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.privacy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {operator} · {email}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-7">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
