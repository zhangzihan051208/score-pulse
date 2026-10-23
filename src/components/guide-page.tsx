"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";

export function GuidePage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-3 py-8">
      <h1 className="text-2xl font-bold">{t.guide.title}</h1>
      <p className="mt-2 leading-7 text-muted-foreground">{t.guide.lead}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/" className="font-medium text-primary hover:underline">
          ← {t.nav.home}
        </Link>
        <Link href="/my-teams" className="text-primary hover:underline">
          {t.teams.title}
        </Link>
        <Link href="/zones" className="text-primary hover:underline">
          {t.zones.title}
        </Link>
      </div>
      <div className="mt-6 space-y-4">
        {t.guide.sections.map((section) => (
          <section key={section.title} className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">{section.title}</h2>
            {section.body.map((p) => (
              <p key={p} className="mt-2 text-sm leading-6 text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
