"use client";

import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { dimLabel, positionRoleLabels } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { athletes, eventsBySport, formatWhen, overallScore } from "@/lib/data";
import { BOARD_POSITIONS, dimensionIds } from "@/lib/position-ratings";
import { SPORT_ACCENT } from "@/lib/sports";
import type { Sport } from "@/lib/types";

export function BoardPage({ sport }: { sport: Sport }) {
  const { locale, t } = useI18n();
  const list = eventsBySport(sport);
  const positions = BOARD_POSITIONS[sport];

  return (
    <div>
      <section className={`bg-gradient-to-r ${SPORT_ACCENT[sport]} text-white`}>
        <div className="mx-auto max-w-6xl px-3 py-8">
          <Link href="/" className="text-xs text-white/80 hover:underline">
            ← {t.board.backHome}
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{t.sports[sport]}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">{t.sportBlurb[sport]}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-4 px-3 py-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.board.matches}
          </h2>
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              {t.board.empty}
            </p>
          ) : (
            list.map((event) => (
              <article key={event.id} className="rounded-xl border bg-card">
                <Link href={`/events/${event.slug}`} className="block border-b px-4 py-3 hover:bg-muted/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={event.status} />
                    <h3 className="font-semibold">{tx(event.title, locale)}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tx(event.subtitle, locale)} · {tx(event.venue, locale)} ·{" "}
                    {formatWhen(event.startAt, locale)}
                  </p>
                </Link>
                <ul>
                  {event.performances.map((p) => {
                    const athlete = athletes[p.athleteId];
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
        <aside className="h-fit rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.board.dimensions}
          </p>
          <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
            {t.board.dimensionsHint}
          </p>
          <div className="space-y-4">
            {positions.map((key) => (
              <div key={key}>
                <p className="text-xs font-semibold">
                  {positionRoleLabels[locale][key]}
                </p>
                <ol className="mt-1 space-y-0.5">
                  {dimensionIds(key).map((id) => (
                    <li key={id} className="text-[11px] text-muted-foreground">
                      · {dimLabel(locale, key, id)}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
