"use client";

import Link from "next/link";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { StatusPill } from "@/components/status-pill";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import { tx } from "@/lib/copy";
import { formatWhen } from "@/lib/data";
import {
  allPrimaryTeams,
  eventHasTeam,
  eventMatchesPartition,
  partitionToPath,
} from "@/lib/favorite-teams";
import type { MatchEvent } from "@/lib/types";

export function HomeMyTeams({
  events,
}: {
  events: MatchEvent[];
}) {
  const { locale, t } = useI18n();
  const { favorites, hydrated } = useFavoriteTeams();

  if (!hydrated) return null;

  const primaries = allPrimaryTeams(favorites);
  if (primaries.length === 0) {
    return (
      <section className="mt-5 rounded-xl border border-dashed bg-card px-4 py-4">
        <p className="text-sm text-muted-foreground">{t.teams.homeEmpty}</p>
        <Link
          href="/my-teams"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t.teams.setTeams}
        </Link>
      </section>
    );
  }

  const rows = primaries
    .map(({ partition, team }) => {
      const matches = events.filter(
        (e) =>
          eventMatchesPartition(e, partition) && eventHasTeam(e, team),
      );
      const featured =
        matches.find((e) => e.status === "live") ??
        matches.find((e) => e.status === "upcoming") ??
        matches[0];
      return { partition, team, featured, count: matches.length };
    })
    .filter((r) => r.featured);

  if (rows.length === 0) {
    return (
      <section className="mt-5 rounded-xl border bg-card px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.teams.homeTitle}
          </h2>
          <Link href="/my-teams" className="text-xs text-primary hover:underline">
            {t.teams.manage}
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t.teams.noFixturesYet}</p>
      </section>
    );
  }

  return (
    <section className="mt-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.teams.homeTitle}
        </h2>
        <Link href="/my-teams" className="text-xs text-primary hover:underline">
          {t.teams.manage}
        </Link>
      </div>
      <div className="space-y-2">
        {rows.map(({ partition, team, featured, count }) => (
          <article
            key={partition}
            className="rounded-xl border bg-card px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {partition === "nba"
                    ? t.sports.nba
                    : leagueLabel(locale, partition.replace("soccer:", ""))}
                </p>
                <p className="font-semibold">{team.name}</p>
              </div>
              <Link
                href={`/my-teams/${partitionToPath(partition)}/schedule`}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t.teams.allFixtures}
                {count > 0 ? ` (${count})` : ""}
              </Link>
            </div>
            {featured ? (
              <Link
                href={`/events/${featured.slug}`}
                className="mt-3 block rounded-lg bg-muted/50 px-3 py-2 hover:bg-muted"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={featured.status} />
                  <span className="text-sm font-medium">
                    {tx(featured.title, locale)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatWhen(featured.startAt, locale)}
                </p>
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
