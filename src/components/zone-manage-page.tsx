"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";

export function ZoneManagePageInner({ slug }: { slug: string }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-lg px-3 py-8 pb-24">
      <Link
        href={`/zones/${slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {t.zones.title}
      </Link>
      <p className="mt-3 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
        {t.moderation.autoBadge}
      </p>
      <h1 className="font-display mt-3 text-2xl font-bold">{t.zones.moderationTitle}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t.moderation.autoLead}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li>· {t.moderation.blockAd}</li>
        <li>· {t.moderation.blockProfanity}</li>
        <li>· {t.moderation.blockPornViolence}</li>
        <li>· {t.moderation.blockSpam}</li>
      </ul>
    </div>
  );
}
