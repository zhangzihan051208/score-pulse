"use client";

import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { useLiveEvents } from "@/hooks/use-live-events";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import {
  athletes,
  eventsBySport,
  formatWhen,
  overallScore,
} from "@/lib/data";
import { resolveAthlete } from "@/lib/event-resolve";
import { SPORT_ACCENT } from "@/lib/sports";
import { LeagueTabs } from "@/components/league-tabs";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { leagueLabel } from "@/i18n/league-labels";
import { getLeagueBySlug } from "@/lib/leagues";
import type { Sport } from "@/lib/types";

export function BoardPage({
  sport,
  leagueSlug,
}: {
  sport: Sport;
  leagueSlug?: string;
}) {
  const { locale, t } = useI18n();
  const isLive = sport === "nba" || sport === "soccer";
  const league = leagueSlug ? getLeagueBySlug(leagueSlug) : undefined;
  const { events: liveList, syncedAt } = useLiveEvents(
    isLive ? sport : "nba",
    isLive,
    leagueSlug,
  );
  const list = isLive ? liveList : eventsBySport(sport);

  return (
    <div>
      <section className={`bg-gradient-to-r ${SPORT_ACCENT[sport]} text-white`}>
        <div className="mx-auto max-w-6xl px-3 py-8">
          <Link href="/" className="text-xs text-white/80 hover:underline">
            ← {t.board.backHome}
          </Link>
          <h1 className="mt-2 text-3xl font-bold">
            {league ? leagueLabel(locale, league.slug) : t.sports[sport]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            {isLive ? t.home.liveBoardLead : t.sportBlurb[sport]}
          </p>
          {isLive && (
            <div className="mt-4">
              <LeagueTabs sport={sport} activeSlug={leagueSlug} />
            </div>
          )}
          {isLive && syncedAt && (
            <p className="mt-2 text-xs text-white/60">{t.home.liveSyncHint}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-3 px-3 py-6">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.board.matches}
          </h2>
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              {isLive ? t.home.liveEmpty : t.board.empty}
            </p>
          ) : (
            list.map((event) => (
              <article key={event.id} className="rounded-xl border bg-card">
                <Link
                  href={`/events/${event.slug}`}
                  className="block border-b px-4 py-3 hover:bg-muted/40"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={event.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatWhen(event.startAt, locale)}
                    </span>
                  </div>
                  {event.live ? (
                    <MatchScoreboard event={event} size="sm" />
                  ) : (
                    <h3 className="font-semibold">{tx(event.title, locale)}</h3>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.leagueSlug
                      ? leagueLabel(locale, event.leagueSlug)
                      : tx(event.subtitle, locale)}
                    {event.live
                      ? ` · ${event.performances.length} ${t.home.players}`
                      : ""}
                  </p>
                </Link>
                <ul>
                  {event.performances.map((p) => {
                    const athlete =
                      resolveAthlete(event, p.athleteId) ??
                      athletes[p.athleteId];
                    if (!athlete) return null;
                    return (
                      <li key={p.athleteId}>
                        <Link
                          href={`/events/${event.slug}/${athlete.id}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/40"
                        >
                          <span>
                            {athlete.name}
                            <span className="ml-2 text-muted-foreground">
                              {tx(p.role, locale)}
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums text-primary">
                            {overallScore(p.communityAvg, p.positionKey).toFixed(1)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))
          )}
      </div>
    </div>
  );
}
