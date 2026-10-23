"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerCardTabs } from "@/components/player-card-tabs";
import { Overall } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { dimLabel, positionRoleLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/score-display";
import {
  buildEventMatchups,
  findMatchupForAthlete,
  opponentInMatchup,
  sideInMatchup,
} from "@/lib/matchup-pairs";
import { playerHubHref } from "@/lib/player-routes";
import { dimensionIds } from "@/lib/position-ratings";
import { meanDimensionScore } from "@/lib/radar-scale";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

export function PlayerMatchupView({
  event,
  athlete,
  performance,
}: {
  event: MatchEvent;
  athlete: Athlete;
  performance: Performance;
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const positionKey = performance.positionKey;
  const dimIds = dimensionIds(positionKey);
  const dimLabels = dimIds.map((id) => dimLabel(locale, positionKey, id));

  const pair = useMemo(
    () => findMatchupForAthlete(event, athlete.id, state, locale),
    [event, athlete.id, state, locale],
  );

  const allPairs = useMemo(
    () => buildEventMatchups(event, state, locale),
    [event, state, locale],
  );

  const subjectSide = pair ? sideInMatchup(pair, athlete.id) : null;
  const homeEntry = pair?.home;
  const awayEntry = pair?.away;

  const baselineMean = useMemo(() => {
    if (!homeEntry || !awayEntry) return 7;
    const ids = [...dimIds];
    const h = meanDimensionScore(homeEntry.merged.avg, ids);
    const a = meanDimensionScore(awayEntry.merged.avg, ids);
    return (h + a) / 2;
  }, [homeEntry, awayEntry, dimIds]);

  const radarSeries = useMemo(() => {
    if (!homeEntry || !awayEntry) return [];
    return [
      {
        label: homeEntry.athlete.name,
        scores: homeEntry.merged.avg,
        stroke: "oklch(0.55 0.2 250)",
        fill: "oklch(0.55 0.2 250 / 0.28)",
      },
      {
        label: awayEntry.athlete.name,
        scores: awayEntry.merged.avg,
        stroke: "oklch(0.62 0.19 38)",
        fill: "oklch(0.62 0.19 38 / 0.28)",
      },
    ];
  }, [homeEntry, awayEntry]);

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 pb-24">
      <Link
        href={`/events/${event.slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {t.rate.back}
      </Link>

      <p className="mt-3 text-xs text-muted-foreground">
        {t.sports[event.sport]} · {tx(event.title, locale)}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{t.matchup.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.matchup.lead}</p>

      <PlayerCardTabs slug={event.slug} athleteId={athlete.id} active="matchup" />

      {!pair || !homeEntry || !awayEntry ? (
        <p className="mt-8 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t.matchup.noCounterpart}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-muted-foreground">
            {positionRoleLabel(locale, positionKey)}
            {pair.slot > 0 ? ` · ${t.matchup.slot} ${pair.slot + 1}` : ""}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[homeEntry, awayEntry].map((entry) => {
              const isYou = entry.athlete.id === athlete.id;
              return (
                <Link
                  key={entry.athlete.id}
                  href={`/events/${event.slug}/${entry.athlete.id}`}
                  className={`rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 ${
                    isYou ? "ring-2 ring-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar athlete={entry.athlete} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{entry.athlete.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.athlete.id === pair.home.athlete.id
                          ? t.event.homeSpotlight
                          : t.event.awaySpotlight}
                        {isYou ? ` · ${t.matchup.you}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Overall
                        value={overallScore(entry.merged.avg, positionKey)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {entry.merged.count} {t.event.ratings}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <section className="mt-6 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">{t.matchup.radarTitle}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.matchup.radarHint}</p>
            <div className="mt-4">
              <DimensionRadar
                dimIds={[...dimIds]}
                dimLabels={dimLabels}
                series={radarSeries}
                baselineMean={baselineMean}
                size={280}
              />
            </div>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              <li className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: "oklch(0.55 0.2 250)" }}
                />
                {homeEntry.athlete.name}
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: "oklch(0.62 0.19 38)" }}
                />
                {awayEntry.athlete.name}
              </li>
            </ul>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {t.rate.radarLegend}
            </p>
          </section>

          {subjectSide && opponentInMatchup(pair, athlete.id) ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t.matchup.vsLabel.replace(
                "{opponent}",
                opponentInMatchup(pair, athlete.id)!.athlete.name,
              )}
            </p>
          ) : null}

          <Link
            href={playerHubHref(event.sport, athlete.id)}
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            {t.player.profileLink}
          </Link>
        </>
      )}

      {allPairs.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">{t.matchup.allInMatch}</h2>
          <ul className="mt-2 space-y-2">
            {allPairs.map((p) => {
              const key = `${p.positionKey}-${p.slot}-${p.home.athlete.id}-${p.away.athlete.id}`;
              const active =
                p.home.athlete.id === athlete.id || p.away.athlete.id === athlete.id;
              const otherHref = (id: string) =>
                `/events/${event.slug}/${id}/matchup`;
              return (
                <li
                  key={key}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    active ? "border-primary/40 bg-primary/5" : ""
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {p.home.athlete.name}{" "}
                    <span className="text-muted-foreground">{t.matchup.vs}</span>{" "}
                    {p.away.athlete.name}
                  </span>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <Link href={otherHref(p.home.athlete.id)} className="text-primary hover:underline">
                      {t.matchup.openHome}
                    </Link>
                    <Link href={otherHref(p.away.athlete.id)} className="text-primary hover:underline">
                      {t.matchup.openAway}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link
            href={`/events/${event.slug}/${athlete.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {t.rate.title}
          </Link>
          <Link
            href={`/events/${event.slug}/${athlete.id}/post`}
            className="inline-flex h-10 flex-[2] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.rate.postComment}
          </Link>
        </div>
      </div>
    </div>
  );
}
