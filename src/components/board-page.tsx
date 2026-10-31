"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { LoadingView } from "@/components/loading-view";
import { StatusPill } from "@/components/status-pill";
import { useEsportsEvents } from "@/hooks/use-esports-events";
import { useLiveEvents } from "@/hooks/use-live-events";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { eventsBySport, formatWhen } from "@/lib/data";
import { pinBayernArsenal } from "@/lib/featured/bayern-arsenal";
import { SPORT_ACCENT } from "@/lib/sports";
import { EventSpotlightGrid } from "@/components/event-spotlight-card";
import { LeagueTabs } from "@/components/league-tabs";
import { MatchStatusTabs, useMatchStatus } from "@/components/match-status-tabs";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { useCommunity } from "@/hooks/use-community";
import { leagueLabel } from "@/i18n/league-labels";
import { ESPORTS_GAMES, getEsportsGame, isEsportsGameSlug } from "@/lib/esports-games";
import { getLeagueBySlug } from "@/lib/leagues";
import type { MatchEvent, Sport } from "@/lib/types";

export function BoardPage({
  sport,
  leagueSlug,
  initialEvents = [],
}: {
  sport: Sport;
  leagueSlug?: string;
  initialEvents?: MatchEvent[];
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const isTsdbLive = sport === "nba" || sport === "soccer";
  const isEsports = sport === "esports";
  const league =
    sport === "esports" && leagueSlug && isEsportsGameSlug(leagueSlug)
      ? undefined
      : leagueSlug
        ? getLeagueBySlug(leagueSlug)
        : undefined;
  const esportsGame =
    sport === "esports" && leagueSlug && isEsportsGameSlug(leagueSlug)
      ? getEsportsGame(leagueSlug)
      : undefined;

  const { events: tsdbList, loading: tsdbLoading, syncedAt } = useLiveEvents(
    isTsdbLive ? sport : "nba",
    isTsdbLive,
    isTsdbLive ? leagueSlug : undefined,
    isTsdbLive ? initialEvents : undefined,
  );
  const { events: esportsList, loading: esportsLoading, source: esportsSource } =
    useEsportsEvents(
    esportsGame?.slug,
    isEsports,
    isEsports ? initialEvents : [],
  );

  const esportsFiltered = useMemo(() => {
    if (!isEsports) return [];
    if (!esportsGame) return esportsList;
    return esportsList.filter((e) => e.leagueSlug === esportsGame.slug);
  }, [esportsGame, esportsList, isEsports]);

  const esportsSections = useMemo(() => {
    if (!isEsports || esportsGame) return null;
    const byGame = new Map<string, MatchEvent[]>();
    for (const e of esportsList) {
      const key = e.leagueSlug ?? "other";
      byGame.set(key, [...(byGame.get(key) ?? []), e]);
    }
    return ESPORTS_GAMES.map((g) => ({
      slug: g.slug,
      events: byGame.get(g.slug) ?? [],
    }));
  }, [esportsGame, esportsList, isEsports]);

  const rawList = isEsports
    ? esportsFiltered
    : isTsdbLive
      ? tsdbList
      : eventsBySport(sport);
  const list = sport === "soccer" ? pinBayernArsenal(rawList, leagueSlug) : rawList;
  const loading = isEsports ? esportsLoading : tsdbLoading;
  const showLiveBoard = isTsdbLive || isEsports;

  return (
    <div>
      <section className={`bg-gradient-to-r ${SPORT_ACCENT[sport]} text-white`}>
        <div className="mx-auto max-w-6xl px-3 py-8">
          <Link href="/" className="text-xs text-white/80 hover:underline">
            ← {t.board.backHome}
          </Link>
          <h1 className="mt-2 text-3xl font-bold">
            {esportsGame
              ? esportsGame.label
              : league
                ? leagueLabel(locale, league.slug)
                : t.sports[sport]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            {showLiveBoard ? t.home.liveBoardLead : t.sportBlurb[sport]}
          </p>
          {showLiveBoard && (
            <div className="mt-4">
              <LeagueTabs sport={sport} activeSlug={leagueSlug} />
            </div>
          )}
          {isTsdbLive && syncedAt && (
            <p className="mt-2 text-xs text-white/60">{t.home.liveSyncHint}</p>
          )}
          {isEsports && (
            <p className="mt-2 text-xs text-white/60">
              {esportsSource === "kashrock"
                ? t.esports.dataHintKashrock
                : t.esports.dataHint}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-3 px-3 py-6">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.board.matches}
          </h2>
          {showLiveBoard && loading && list.length === 0 ? (
            <LoadingView message="page" variant="section" />
          ) : esportsSections ? (
            <div className="space-y-8">
              {esportsSections.map((section) => (
                <section key={section.slug} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      {leagueLabel(locale, section.slug)}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {section.events.length} {t.home.matches}
                      </span>
                    </h3>
                    <Link
                      href={`/boards/esports/${section.slug}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t.home.enter}
                    </Link>
                  </div>
                  <StatusEventList
                    events={section.events}
                    empty={t.esports.emptyGame}
                    renderEvent={(event) => (
                      <BoardEventCard
                        key={event.id}
                        event={event}
                        locale={locale}
                        t={t}
                        state={state}
                        showGameTag={false}
                      />
                    )}
                  />
                </section>
              ))}
            </div>
          ) : list.length === 0 && !showLiveBoard ? (
            <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              {isEsports ? t.esports.empty : t.board.empty}
            </p>
          ) : (
            <StatusEventList
              events={list}
              empty={t.board.statusEmpty}
              renderEvent={(event) => (
                <BoardEventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  t={t}
                  state={state}
                  showGameTag={isEsports && !esportsGame}
                />
              )}
            />
          )}
      </div>
    </div>
  );
}

function StatusEventList({
  events,
  empty,
  renderEvent,
}: {
  events: MatchEvent[];
  empty: string;
  renderEvent: (event: MatchEvent) => ReactNode;
}) {
  const { status, setStatus, visible } = useMatchStatus(events);
  return (
    <div className="space-y-3">
      <MatchStatusTabs events={events} status={status} onChange={setStatus} />
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        visible.map((event) => renderEvent(event))
      )}
    </div>
  );
}

function BoardEventCard({
  event,
  locale,
  t,
  state,
  showGameTag,
}: {
  event: MatchEvent;
  locale: ReturnType<typeof useI18n>["locale"];
  t: ReturnType<typeof useI18n>["t"];
  state: ReturnType<typeof useCommunity>["state"];
  showGameTag: boolean;
}) {
  return (
    <article className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <Link
          href={`/events/${event.slug}`}
          className="mb-2 flex flex-wrap items-center gap-2 hover:underline"
        >
          <StatusPill status={event.status} />
          {showGameTag && event.leagueSlug ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {leagueLabel(locale, event.leagueSlug)}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {formatWhen(event.startAt, locale)}
          </span>
        </Link>
        <MatchScoreboard
          event={event}
          size="sm"
          matchHref={`/events/${event.slug}`}
          playerCount={event.performances.length}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {tx(event.subtitle, locale)}
          {` · ${event.performances.length} ${t.home.players}`}
        </p>
      </div>
      <div className="border-t px-3 py-3">
        <EventSpotlightGrid event={event} state={state} compact />
      </div>
    </article>
  );
}
