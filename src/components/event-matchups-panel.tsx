"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { Overall } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { dimLabel, positionRoleLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { buildEventMatchups, type MatchupPair } from "@/lib/matchup-pairs";
import { dimensionIds } from "@/lib/position-ratings";
import { overallScore } from "@/lib/score-display";
import type { MatchEvent } from "@/lib/types";

export function EventMatchupsPanel({
  event,
  fullPage = false,
}: {
  event: MatchEvent;
  fullPage?: boolean;
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const pairs = useMemo(
    () => buildEventMatchups(event, state, locale),
    [event, state, locale],
  );

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">
        {fullPage ? t.event.matchupsTab : t.matchup.allInMatch}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {fullPage ? t.event.matchupsLead : t.matchup.eventLead}
      </p>
      {pairs.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
          {t.matchup.noCounterpart}
        </p>
      ) : null}
      {pairs.length > 0 ? (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {pairs.map((pair) => (
            <MatchupOverlayCard key={pairKey(pair)} event={event} pair={pair} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function pairKey(pair: MatchupPair) {
  return `${pair.positionKey}-${pair.slot}-${pair.home.athlete.id}-${pair.away.athlete.id}`;
}

function MatchupOverlayCard({
  event,
  pair,
}: {
  event: MatchEvent;
  pair: MatchupPair;
}) {
  const { locale, t } = useI18n();
  const dimIds = [...dimensionIds(pair.positionKey)];
  const dimLabels = dimIds.map((id) => dimLabel(locale, pair.positionKey, id));
  const series = [
    {
      label: pair.home.athlete.name,
      scores: pair.home.merged.avg,
      stroke: "oklch(0.55 0.2 250)",
      fill: "oklch(0.55 0.2 250 / 0.28)",
    },
    {
      label: pair.away.athlete.name,
      scores: pair.away.merged.avg,
      stroke: "oklch(0.62 0.19 38)",
      fill: "oklch(0.62 0.19 38 / 0.28)",
    },
  ];

  return (
    <li className="min-w-0 overflow-hidden rounded-xl border bg-background p-3">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {positionRoleLabel(locale, pair.positionKey)}
        {pair.slot > 0 ? ` · ${t.matchup.slot} ${pair.slot + 1}` : ""}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Link
          href={`/events/${event.slug}/${pair.home.athlete.id}`}
          className="min-w-0 hover:underline"
        >
          <p className="truncate text-sm font-medium">{pair.home.athlete.name}</p>
          <Overall value={overallScore(pair.home.merged.avg, pair.positionKey)} />
        </Link>
        <Link
          href={`/events/${event.slug}/${pair.away.athlete.id}`}
          className="min-w-0 text-right hover:underline"
        >
          <p className="truncate text-sm font-medium">{pair.away.athlete.name}</p>
          <Overall value={overallScore(pair.away.merged.avg, pair.positionKey)} />
        </Link>
      </div>
      <DimensionRadar
        dimIds={dimIds}
        dimLabels={dimLabels}
        series={series}
        size={240}
      />
      <p className="text-center text-[11px] text-muted-foreground">{t.matchup.radarHint}</p>
    </li>
  );
}
