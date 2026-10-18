"use client";

import Link from "next/link";
import { ApiFixturesStrip } from "@/components/api-fixtures-strip";
import { StatusPill } from "@/components/status-pill";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { athletes, events, meanScore } from "@/lib/data";
import { SPORT_CHIP } from "@/lib/sports";
import { SPORTS, type Sport } from "@/lib/types";

export function HomeBoards() {
  const { locale, t } = useI18n();
  const live = events.filter((e) => e.status === "live");

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
      </section>

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

      <ApiFixturesStrip />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.boardsTitle}
          </h2>
          {SPORTS.map((sport) => (
            <BoardBlock key={sport} sport={sport} />
          ))}
        </div>
        <aside className="h-fit rounded-xl border bg-card lg:sticky lg:top-16">
          <div className="border-b px-3 py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.home.hot}
          </div>
          <ul>
            {events
              .flatMap((event) =>
                event.performances.map((p) => ({ event, p })),
              )
              .sort((a, b) => b.p.ratingCount - a.p.ratingCount)
              .slice(0, 8)
              .map(({ event, p }) => {
                const athlete = athletes[p.athleteId];
                return (
                  <li key={`${event.id}-${p.athleteId}`} className="border-b last:border-0">
                    <Link
                      href={`/events/${event.slug}/${p.athleteId}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{athlete.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.sports[event.sport]} · {tx(event.title, locale)}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {meanScore(p.communityAvg).toFixed(1)}
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

function BoardBlock({ sport }: { sport: Sport }) {
  const { locale, t } = useI18n();
  const list = events.filter((e) => e.sport === sport);
  const featured = list[0];
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
      <Link
        href={`/events/${featured.slug}`}
        className="block border-b px-3 py-3 hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <StatusPill status={featured.status} />
          <span className="font-medium">{tx(featured.title, locale)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {tx(featured.summary, locale)}
        </p>
      </Link>
      <ul>
        {featured.performances.map((p) => {
          const athlete = athletes[p.athleteId];
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
                  {meanScore(p.communityAvg).toFixed(1)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
