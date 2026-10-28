"use client";

import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { events } from "@/lib/data";
import { isSeedOnlyBoardSport } from "@/lib/fixture-retention";
import { SPORT_CHIP } from "@/lib/sports";
import type { Sport } from "@/lib/types";

export function LegacyBoardBlock({ sport }: { sport: Sport }) {
  const { locale, t } = useI18n();
  const featured = isSeedOnlyBoardSport(sport) ? undefined : events.find((e) => e.sport === sport);

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${SPORT_CHIP[sport]}`} />
          <h3 className="font-semibold">{t.sports[sport]}</h3>
        </div>
        <Link
          href={`/boards/${sport}`}
          prefetch={false}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.home.enter}
        </Link>
      </div>
      {!featured ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">{t.board.empty}</p>
      ) : (
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
      )}
    </section>
  );
}
