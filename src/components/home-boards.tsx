"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HomeMyTeams } from "@/components/home-my-teams";
import { StatusPill } from "@/components/status-pill";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useLiveEvents } from "@/hooks/use-live-events";
import { sortEventsForHome } from "@/lib/favorite-teams";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { events, formatWhen, overallScore } from "@/lib/data";
import { PlayerAvatar } from "@/components/player-avatar";
import { resolveAthlete } from "@/lib/event-resolve";
import { SPORT_CHIP } from "@/lib/sports";
import { LeagueTabs } from "@/components/league-tabs";
import { leagueLabel } from "@/i18n/league-labels";
import { SPORTS, type MatchEvent, type Sport } from "@/lib/types";

const LIVE_SPORTS: Sport[] = ["nba", "soccer"];

export function HomeBoards() {
  const { locale, t } = useI18n();
  const { events: liveAll, syncedAt } = useLiveEvents();
  const { favorites, hydrated } = useFavoriteTeams();
  const sortedAll = useMemo(
    () => (hydrated ? sortEventsForHome(liveAll, favorites) : liveAll),
    [favorites, hydrated, liveAll],
  );
  const live = sortedAll.filter((e) => e.status === "live");

  return (
    <div className="mx-auto max-w-6xl px-3 py-6">
      <section className="rounded-xl bg-[#141414] px-5 py-8 text-white sm:px-8">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          {t.home.kicker}
        </p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          {t.home.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
          {t.home.lead}
        </p>
        {syncedAt && (
          <p className="mt-3 text-xs text-white/50">{t.home.liveSyncHint}</p>
        )}
      </section>

      <HomeMyTeams events={sortedAll} />

      {live.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.liveNow}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {live.map((event) => (
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
          {LIVE_SPORTS.map((sport) => (
            <LiveSportBlock
              key={sport}
              sport={sport as "nba" | "soccer"}
              list={sortedAll.filter((e) => e.sport === sport)}
            />
          ))}
          {SPORTS.filter((s) => !LIVE_SPORTS.includes(s)).map((sport) => (
            <LegacyBoardBlock key={sport} sport={sport} />
          ))}
        </div>
        <aside className="h-fit rounded-xl border bg-card lg:sticky lg:top-16">
          <div className="border-b px-3 py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.hot}
          </div>
          <ul>
            {liveAll
              .flatMap((event) =>
                event.performances.slice(0, 6).map((p) => ({ event, p })),
              )
              .slice(0, 8)
              .map(({ event, p }) => {
                const athlete = resolveAthlete(event, p.athleteId);
                if (!athlete) return null;
                return (
                  <li key={`${event.id}-${p.athleteId}`} className="border-b last:border-0">
                    <Link
                      href={`/events/${event.slug}/${p.athleteId}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/60"
                    >
                      <PlayerAvatar athlete={athlete} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{athlete.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.sports[event.sport]} · {tx(event.title, locale)}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {overallScore(p.communityAvg, p.positionKey).toFixed(1)}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function LiveSportBlock({
  sport,
  list,
}: {
  sport: "nba" | "soccer";
  list: MatchEvent[];
}) {
  const { locale, t } = useI18n();
  const featured = list[0];

  if (list.length === 0) {
    return (
      <section className="rounded-xl border border-dashed bg-card px-3 py-6 text-sm text-muted-foreground">
        {t.home.liveEmpty}
      </section>
    );
  }

  if (!featured) return null;

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
      {list.slice(0, sport === "soccer" ? 4 : 1).map((event) => (
        <FeaturedEventRow key={event.id} event={event} locale={locale} t={t} />
      ))}
      <ul>
        {featured.performances.slice(0, 8).map((p) => {
          const athlete = resolveAthlete(featured, p.athleteId);
          if (!athlete) return null;
          return (
            <li key={p.athleteId} className="border-b last:border-0">
              <Link
                href={`/events/${featured.slug}/${p.athleteId}`}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span>
                  <span className="text-muted-foreground">{t.home.rate} </span>
                  {athlete.name}
                </span>
                <span className="font-semibold tabular-nums text-primary">
                  {overallScore(p.communityAvg, p.positionKey).toFixed(1)}
                </span>
              </Link>
            </li>
          );
        })}
        {featured.performances.length > 8 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">
            +{featured.performances.length - 8} {t.home.morePlayers}
          </li>
        )}
      </ul>
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
  return (
    <Link
      href={`/events/${event.slug}`}
      className="block border-b px-3 py-3 hover:bg-muted/40"
    >
      <div className="flex items-center gap-2">
        <StatusPill status={event.status} />
        <span className="font-medium">{tx(event.title, locale as "en")}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {event.leagueSlug
          ? leagueLabel(locale as "en", event.leagueSlug)
          : tx(event.subtitle, locale as "en")}{" "}
        · {event.performances.length} {t.home.players}
      </p>
    </Link>
  );
}

function LegacyBoardBlock({ sport }: { sport: Sport }) {
  const { locale, t } = useI18n();
  const list = events.filter((e) => e.sport === sport);
  const featured = list[0];
  if (!featured) return null;

  return (
    <section className="overflow-hidden rounded-xl border bg-card opacity-90">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${SPORT_CHIP[sport]}`} />
          <h3 className="font-semibold">{t.sports[sport]}</h3>
          <span className="text-xs text-muted-foreground">{t.home.demoArchive}</span>
        </div>
        <Link
          href={`/boards/${sport}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.home.enter}
        </Link>
      </div>
      <Link
        href={`/events/${featured.slug}`}
        className="block border-b px-3 py-3 hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <StatusPill status={featured.status} />
          <span className="font-medium">{tx(featured.title, locale)}</span>
        </div>
      </Link>
    </section>
  );
}
