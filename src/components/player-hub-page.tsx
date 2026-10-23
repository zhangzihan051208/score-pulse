"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { DimensionChips } from "@/components/rating-guide-panel";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel } from "@/i18n/position-dims";
import type { PlayerEventRating } from "@/lib/rankings-server";
import { dimensionIds, type PositionKey } from "@/lib/position-ratings";
import { blendScores, playerOverall } from "@/lib/reputation/blend";
import type { ReputationCard } from "@/lib/reputation/types";
import { playerHubHref, rankingsHref } from "@/lib/player-routes";
import type { ScoreMap, Sport } from "@/lib/types";

type HubPayload = {
  profile: {
    display_name: string;
    team_id: string | null;
    team_name: string | null;
    photo_url: string | null;
    position_key: string;
  } | null;
  careerOverall: number | null;
  careerAvg: ScoreMap | null;
  totalRatings: number;
  byEvent: PlayerEventRating[];
  reputation: ReputationCard | null;
};

export function PlayerHubPageInner({
  sport,
  playerId,
}: {
  sport: Sport;
  playerId: string;
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const [data, setData] = useState<HubPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `/api/players/${encodeURIComponent(sport)}/${encodeURIComponent(playerId)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: HubPayload | null) => setData(d))
      .finally(() => setLoading(false));
  }, [playerId, sport]);

  const positionKey = (data?.profile?.position_key ??
    data?.reputation?.positionKey ??
    "nba.guard") as PositionKey;
  const radarIds = data?.reputation?.dimIds?.length
    ? data.reputation.dimIds
    : [...dimensionIds(positionKey)];

  const shown = useMemo(() => {
    if (!data?.careerAvg || !data.reputation) {
      return { scores: data?.careerAvg ?? null, overall: data?.careerOverall ?? null };
    }
    const seen = new Set(data.byEvent.map((row) => row.eventId));
    const locals: ScoreMap[] = [];
    for (const rating of Object.values(state.ratings)) {
      if (rating.athleteId !== playerId && rating.athleteId !== data.reputation.id) continue;
      if (seen.has(rating.eventId)) continue;
      locals.push(rating.scores);
    }
    if (!locals.length) {
      return { scores: data.careerAvg, overall: data.careerOverall };
    }
    const scores = blendScores(
      data.careerAvg,
      data.reputation.seedWeight + data.reputation.matchSamples,
      locals,
      data.reputation.dimIds,
    );
    return {
      scores,
      overall: playerOverall(scores, data.reputation.positionKey ?? positionKey),
    };
  }, [data, playerId, positionKey, state.ratings]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-10 text-sm text-muted-foreground">
        {t.common.loadingPage}
      </div>
    );
  }

  const name = data?.profile?.display_name ?? playerId;
  const teamId = data?.profile?.team_id ?? undefined;
  const teamName = data?.profile?.team_name ?? undefined;
  const teamHref =
    teamId && (sport === "nba" || sport === "soccer")
      ? `/teams/${encodeURIComponent(teamId)}?sport=${sport}${teamName ? `&name=${encodeURIComponent(teamName)}` : ""}`
      : teamId
        ? rankingsHref({ sport, teamId })
        : undefined;

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 pb-24">
      <Link href={`/boards/${sport}`} className="text-xs text-muted-foreground hover:underline">
        ← {t.sports[sport]}
      </Link>

      <header className="mt-4 flex gap-4">
        <PlayerAvatar
          athlete={{
            name,
            shortName: name.slice(0, 2),
            photoUrl: data?.profile?.photo_url ?? undefined,
          }}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t.player.hubKicker}</p>
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          {teamName ? (
            teamHref ? (
              <Link href={teamHref} className="text-sm text-primary hover:underline">
                {teamName}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">{teamName}</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">{t.player.noTeam}</p>
          )}
          {shown.overall != null && (
            <div className="mt-2 flex items-end gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">
                  {data?.reputation ? t.player.fiveTitle : t.player.careerAvg}
                </p>
                <Overall value={shown.overall} />
              </div>
              <p className="pb-1 text-xs text-muted-foreground">
                {data?.totalRatings.toLocaleString()} {t.event.ratings}
              </p>
            </div>
          )}
        </div>
      </header>

      {shown.scores && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">
            {data?.reputation ? t.player.fiveHint : t.player.careerAxes}
          </p>
          {data?.reputation ? (
            <p className="mt-1 text-sm leading-6">
              {locale === "zh" ? data.reputation.honors.zh : data.reputation.honors.en}
            </p>
          ) : null}
          <div className="mt-3 flex justify-center">
            <DimensionRadar
              dimIds={radarIds}
              dimLabels={radarIds.map((id) => dimLabel(locale, positionKey, id))}
              size={220}
              series={[
                {
                  label: name,
                  scores: shown.scores,
                  stroke: "oklch(0.58 0.19 38)",
                  fill: "oklch(0.58 0.19 38 / 0.22)",
                },
              ]}
            />
          </div>
          <div className="mt-2">
            <DimensionChips positionKey={positionKey} scores={shown.scores} />
          </div>
          {data?.reputation?.takes?.length ? (
            <ul className="mt-4 space-y-2">
              {data.reputation.takes.map((take) => (
                <li key={take.id} className="rounded-md bg-muted/40 px-3 py-2 text-sm leading-6">
                  {locale === "zh" ? take.zh : take.en}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {teamId ? (
          <Link
            href={rankingsHref({ sport, teamId })}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            {t.player.teamRankLink}
          </Link>
        ) : null}
        <Link
          href={rankingsHref({ sport })}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
        >
          {t.player.globalRankLink}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.player.eventRankTitle}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.player.eventRankHint}</p>
        {!data?.byEvent.length ? (
          <p className="mt-4 text-sm text-muted-foreground">{t.player.noRatingsYet}</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {data.byEvent.map((row, idx) => (
              <li key={row.eventId}>
                <EventRatingRow
                  rank={idx + 1}
                  row={row}
                  sport={sport}
                  playerId={playerId}
                  positionKey={positionKey}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function EventRatingRow({
  rank,
  row,
  sport,
  playerId,
  positionKey,
}: {
  rank: number;
  row: PlayerEventRating;
  sport: Sport;
  playerId: string;
  positionKey: import("@/lib/position-ratings").PositionKey;
}) {
  const { t } = useI18n();
  const href = row.eventSlug
    ? `/events/${row.eventSlug}/${encodeURIComponent(playerId)}`
    : undefined;

  const inner = (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {row.eventTitle ?? `${t.player.matchFallback} ${row.eventId.slice(0, 8)}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {[row.eventDate, `${row.ratingCount} ${t.event.ratings}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Overall value={row.overall} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:border-primary/40">
        {inner}
      </Link>
    );
  }

  return inner;
}
