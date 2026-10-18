"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import { leaguesForSport } from "@/lib/leagues";
import type { Sport } from "@/lib/types";
import { cn } from "cn";

export function LeagueTabs({
  sport,
  activeSlug,
}: {
  sport: Sport;
  activeSlug?: string;
}) {
  const { locale, t } = useI18n();
  const leagues = leaguesForSport(sport);
  if (leagues.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/boards/${sport}`}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          !activeSlug
            ? "border-primary bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        {t.board.allLeagues}
      </Link>
      {leagues.map((league) => {
        const href =
          league.sport === "nba"
            ? `/boards/nba`
            : `/boards/soccer/${league.slug}`;
        const active = activeSlug === league.slug;
        return (
          <Link
            key={league.slug}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {leagueLabel(locale, league.slug)}
          </Link>
        );
      })}
    </div>
  );
}
