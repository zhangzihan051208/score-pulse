"use client";

import Link from "next/link";
import { LeagueStandings } from "@/components/league-standings";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import type { LeagueConfig } from "@/lib/leagues";
import type { LeagueTablePayload } from "@/lib/league-table";
import { SPORT_ACCENT } from "@/lib/sports";

export function StandingsScreen({
  league,
  table,
}: {
  league: LeagueConfig;
  table: LeagueTablePayload;
}) {
  const { locale, t } = useI18n();
  const back =
    league.sport === "nba" ? "/boards/nba" : `/boards/${league.sport}/${league.slug}`;

  return (
    <div>
      <section className={`bg-gradient-to-r ${SPORT_ACCENT[league.sport]} text-white`}>
        <div className="mx-auto max-w-6xl px-3 py-8">
          <Link href={back} className="text-xs text-white/80 hover:underline">
            ← {t.table.backToMatches}
          </Link>
          <h1 className="mt-2 text-3xl font-bold">
            {leagueLabel(locale, league.slug)}
            <span className="ml-2 text-xl font-semibold text-white/80">· {t.table.standings}</span>
          </h1>
          <p className="mt-2 text-xs text-white/70">{table.season}</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-3 py-6">
        <LeagueStandings table={table} t={t} />
      </div>
    </div>
  );
}
