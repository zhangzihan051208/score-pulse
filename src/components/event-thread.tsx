"use client";

import Link from "next/link";
import { Overall, ScoreRows } from "@/components/score-rows";
import { StatusPill } from "@/components/status-pill";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { formatWhen, overallScore } from "@/lib/data";
import { resolveAthlete } from "@/lib/event-resolve";
import { mergedAverages } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

export function EventThread({ event }: { event: MatchEvent }) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();

  return (
    <div>
      <section className={`bg-gradient-to-r ${event.cover} text-white`}>
        <div className="mx-auto max-w-3xl px-3 py-8">
          <Link
            href={`/boards/${event.sport}`}
            className="text-xs text-white/80 hover:underline"
          >
            ← {t.sports[event.sport]}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={event.status} />
            <span className="text-sm text-white/80">{tx(event.subtitle, locale)}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{tx(event.title, locale)}</h1>
          <p className="mt-2 text-sm text-white/85">{tx(event.summary, locale)}</p>
          <p className="mt-2 text-xs text-white/70">
            {tx(event.venue, locale)} · {formatWhen(event.startAt, locale)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-3 px-3 py-6">
        {event.performances.map((p) => {
          const athlete = resolveAthlete(event, p.athleteId);
          const merged = mergedAverages(event, p.athleteId, state);
          if (!merged || !athlete) return null;
          return (
            <article key={p.athleteId} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#141414] text-sm font-semibold text-white">
                    {athlete.shortName}
                  </span>
                  <div>
                    <h2 className="font-semibold">{athlete.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {athlete.team ? `${athlete.team} · ` : ""}
                      {tx(p.role, locale)}
                      {p.result ? ` · ${tx(p.result, locale)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Overall value={overallScore(merged.avg, merged.positionKey)} />
                  <p className="text-[11px] text-muted-foreground">
                    {merged.count.toLocaleString()} {t.event.ratings}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6">{tx(p.highlight, locale)}</p>
              <dl className="mt-3 flex flex-wrap gap-1.5">
                {p.stats.map((stat) => (
                  <div key={tx(stat.label, locale)} className="rounded bg-muted px-2 py-1 text-xs">
                    <span className="text-muted-foreground">{tx(stat.label, locale)} </span>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <ScoreRows positionKey={p.positionKey} scores={merged.avg} compact />
              </div>
              <Link
                href={`/events/${event.slug}/${athlete.id}`}
                className="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                {t.event.ratePlayer}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
