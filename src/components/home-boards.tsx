"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { HomeMyTeams } from "@/components/home-my-teams";
import { LoadingView } from "@/components/loading-view";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { StatusPill } from "@/components/status-pill";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useLiveEvents } from "@/hooks/use-live-events";
import { sortEventsForHome } from "@/lib/favorite-teams";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { formatWhen, overallScore } from "@/lib/score-display";
import { EventSpotlightGrid } from "@/components/event-spotlight-card";
import { PlayerAvatar } from "@/components/player-avatar";
import { useCommunity } from "@/hooks/use-community";
import { pickEventSpotlights } from "@/lib/event-spotlight";
import { SPORT_CHIP } from "@/lib/sports";
import { LeagueTabs } from "@/components/league-tabs";
import { MatchStatusTabs, useMatchStatus } from "@/components/match-status-tabs";
import { leagueLabel } from "@/i18n/league-labels";
import {
  HOME_LIVE_CHIP_PER_SPORT,
  HOME_MATCH_ROWS_PER_SPORT,
} from "@/lib/display-limits";
import { pinBayernArsenal } from "@/lib/featured/bayern-arsenal";
import { SPORTS, type MatchEvent, type Sport } from "@/lib/types";

const LegacyBoardBlock = dynamic(
  () => import("@/components/legacy-board-block").then((m) => m.LegacyBoardBlock),
  { loading: () => null },
);

const LIVE_SPORTS: Sport[] = ["nba", "soccer"];

export function HomeBoards({ initialEvents = [] }: { initialEvents?: MatchEvent[] }) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const { events: liveAll, loading: liveLoading, syncedAt } = useLiveEvents(
    undefined,
    true,
    undefined,
    initialEvents,
  );
  const { favorites, hydrated } = useFavoriteTeams();
  const sortedAll = useMemo(() => {
    const pinned = pinBayernArsenal(liveAll);
    return hydrated ? sortEventsForHome(pinned, favorites) : pinned;
  }, [favorites, hydrated, liveAll]);
  const live = sortedAll.filter((e) => e.status === "live");
  const liveChips = useMemo(() => {
    const caps: Partial<Record<Sport, number>> = {};
    const out: MatchEvent[] = [];
    for (const event of live) {
      const n = caps[event.sport] ?? 0;
      if (n >= HOME_LIVE_CHIP_PER_SPORT) continue;
      caps[event.sport] = n + 1;
      out.push(event);
    }
    return out;
  }, [live]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c0c10] via-[#16120e] to-[#101014] px-5 py-10 text-white shadow-xl shadow-black/15 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-orange-600/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-mark.jpg"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-xl object-cover ring-1 ring-white/20"
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {t.home.kicker}
          </p>
        </div>
        <h1 className="font-display relative mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
          {t.home.title}
        </h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
          {t.home.lead}
        </p>
        <p className="relative mt-2 text-xs text-white/45">{t.tagline}</p>
        {syncedAt && (
          <p className="relative mt-3 text-xs text-white/50">{t.home.liveSyncHint}</p>
        )}
      </section>

      <Link
        href="/zones"
        className="mt-4 flex items-center justify-between rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-orange-500/10 px-4 py-3 transition-colors hover:border-primary/40"
      >
        <div>
          <p className="text-sm font-semibold">{t.zones.homeStrip}</p>
          <p className="text-xs text-muted-foreground">{t.zones.lead}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-primary">{t.zones.homeStripCta}</span>
      </Link>

      <HomeMyTeams events={sortedAll} />

      {liveChips.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.liveNow}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {liveChips.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <StatusPill status={event.status} />
                <span className="font-medium">{tx(event.title, locale)}</span>
                <span className="text-muted-foreground">{t.sports[event.sport]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.boardsTitle}
          </h2>
          {liveLoading && sortedAll.length === 0 ? (
            <LoadingView message="page" variant="section" />
          ) : (
            LIVE_SPORTS.map((sport) => (
              <LiveSportBlock
                key={sport}
                sport={sport as "nba" | "soccer"}
                list={
                  sport === "soccer"
                    ? pinBayernArsenal(sortedAll.filter((e) => e.sport === sport))
                    : sortedAll.filter((e) => e.sport === sport)
                }
                loading={liveLoading}
              />
            ))
          )}
          {SPORTS.filter((s) => !LIVE_SPORTS.includes(s)).map((sport) => (
            <LegacyBoardBlock key={sport} sport={sport} />
          ))}
        </div>
        <aside className="h-fit rounded-xl border bg-card lg:sticky lg:top-16">
          <div className="border-b px-3 py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.hot}
          </div>
          <ul>
            {pinBayernArsenal(liveAll)
              .flatMap((event) =>
                pickEventSpotlights(event, state, locale).map((pick) => ({
                  event,
                  pick,
                })),
              )
              .slice(0, 8)
              .map(({ event, pick }) => (
                <li key={`${event.id}-${pick.athlete.id}`} className="border-b last:border-0">
                  <Link
                    href={`/events/${event.slug}/${pick.athlete.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/60"
                  >
                    <PlayerAvatar athlete={pick.athlete} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pick.athlete.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.sports[event.sport]} · {tx(event.title, locale)}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {overallScore(pick.merged.avg, pick.performance.positionKey).toFixed(1)}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function LiveSportBlock({
  sport,
  list,
  loading = false,
}: {
  sport: "nba" | "soccer";
  list: MatchEvent[];
  loading?: boolean;
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const { status, setStatus, visible } = useMatchStatus(list);
  const featured = visible[0];

  if (list.length === 0) {
    if (loading) {
      return (
        <section className="rounded-xl border bg-card">
          <LoadingView message="page" variant="section" />
        </section>
      );
    }
    return (
      <section className="rounded-xl border border-dashed bg-card px-3 py-6 text-sm text-muted-foreground">
        {t.home.liveEmpty}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${SPORT_CHIP[sport]}`} />
          <h3 className="font-semibold">{t.sports[sport]}</h3>
          <span className="text-xs text-muted-foreground">
            {list.length} {t.home.matches}
          </span>
        </div>
        <Link
          href={`/boards/${sport}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.home.enter}
        </Link>
      </div>
      {sport === "soccer" && (
        <div className="border-b px-3 py-2">
          <LeagueTabs sport="soccer" />
        </div>
      )}
      <div className="border-b px-3 py-2">
        <MatchStatusTabs events={list} status={status} onChange={setStatus} />
      </div>
      {visible.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">{t.board.statusEmpty}</p>
      ) : null}
      {visible.slice(0, HOME_MATCH_ROWS_PER_SPORT).map((event) => (
        <FeaturedEventRow key={event.id} event={event} locale={locale} t={t} />
      ))}
      {featured ? (
        <div className="border-t px-3 py-3">
          <EventSpotlightGrid event={featured} state={state} compact />
        </div>
      ) : null}
    </section>
  );
}

function FeaturedEventRow({
  event,
  locale,
  t,
}: {
  event: MatchEvent;
  locale: string;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const matchHref = `/events/${event.slug}`;
  return (
    <div className="border-b px-3 py-3">
      <Link href={matchHref} className="flex items-center gap-2 hover:underline">
        <StatusPill status={event.status} />
        <span className="text-xs text-muted-foreground">
          {formatWhen(event.startAt, locale as "en")}
        </span>
      </Link>
      {event.status === "live" || event.status === "ended" ? (
        <div className="mt-2">
          <MatchScoreboard event={event} size="sm" matchHref={matchHref} />
        </div>
      ) : (
        <Link href={matchHref} className="mt-1 block font-medium hover:underline">
          {tx(event.title, locale as "en")}
        </Link>
      )}
      <Link
        href={matchHref}
        className="mt-1 line-clamp-2 block text-sm text-muted-foreground hover:text-foreground"
      >
        {event.leagueSlug
          ? leagueLabel(locale as "en", event.leagueSlug)
          : tx(event.subtitle, locale as "en")}{" "}
        · {event.performances.length} {t.home.players}
      </Link>
    </div>
  );
}

