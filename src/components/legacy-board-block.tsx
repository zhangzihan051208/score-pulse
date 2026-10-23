"use client";

import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { events } from "@/lib/data";
import { SPORT_CHIP } from "@/lib/sports";
import type { Sport } from "@/lib/types";

export function LegacyBoardBlock({ sport }: { sport: Sport }) {
  const { locale, t } = useI18n();
  const featured = events.find((e) => e.sport === sport);
  if (!featured) return null;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${SPORT_CHIP[sport]}`} />
          <h3 className="font-semibold">{t.sports[sport]}</h3>
          <span className="text-xs text-muted-foreground">{t.home.demoArchive}</span>
        </div>
        <Link
          href={`/boards/${sport}`}
          prefetch={false}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.home.enter}
        </Link>
      </div>
      <Link
        href={`/events/${featured.slug}`}
        prefetch={false}
        className="block px-3 py-3 hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <StatusPill status={featured.status} />
          <span className="font-medium">{tx(featured.title, locale)}</span>
        </div>
      </Link>
    </section>
  );
}
