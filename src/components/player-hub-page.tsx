"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel } from "@/i18n/position-dims";
import { dimensionIds, type PositionKey } from "@/lib/position-ratings";
import type { PlayerEventRating } from "@/lib/rankings-server";
import { blendScores, playerOverall } from "@/lib/reputation/blend";
import type { DossierFixture, DossierRating } from "@/lib/reputation/dossier";
import { initials } from "@/lib/reputation/portraits";
import type { ReputationCard } from "@/lib/reputation/types";
import { rankingsHref } from "@/lib/player-routes";
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
  schedule?: DossierFixture[];
  recentRatings?: DossierRating[];
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
  const teamHref = teamId
    ? `/teams/${encodeURIComponent(teamId)}?sport=${sport}${teamName ? `&name=${encodeURIComponent(teamName)}` : ""}`
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
            shortName: initials(name),
            photoUrl: data?.profile?.photo_url ?? data?.reputation?.photoUrl,
          }}
          size="xl"
          showJerseyBadge={false}
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
          <div className="mt-3 grid items-center gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
            <DimensionRadar
              dimIds={radarIds}
              dimLabels={radarIds.map((id) => dimLabel(locale, positionKey, id))}
              size={220}
              showLabels={false}
              series={[
                {
                  label: name,
                  scores: shown.scores,
                  stroke: "oklch(0.58 0.19 38)",
                  fill: "oklch(0.58 0.19 38 / 0.22)",
                },
              ]}
            />
            <ul className="space-y-2">
              {radarIds.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{dimLabel(locale, positionKey, id)}</span>
                  <span className="font-semibold tabular-nums">
                    {(shown.scores?.[id] ?? 0).toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data?.reputation ? (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.player.honorsTitle}
          </h2>
          <p className="mt-2 rounded-lg border px-3 py-3 text-sm leading-6">
            {locale === "zh" ? data.reputation.honors.zh : data.reputation.honors.en}
          </p>
        </section>
      ) : null}

      {data?.reputation?.takes?.length ? (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.player.commentsTitle}
          </h2>
          <ul className="mt-2 space-y-2">
            {data.reputation.takes.map((take) => (
              <li key={take.id} className="rounded-md bg-muted/40 px-3 py-2 text-sm leading-6">
                {locale === "zh" ? take.zh : take.en}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.player.scheduleTitle}
        </h2>
        {!data?.schedule?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.player.scheduleEmpty}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.schedule.map((row) => {
              const title = locale === "zh" ? row.title.zh : row.title.en;
              const detail = row.detail
                ? locale === "zh"
                  ? row.detail.zh
                  : row.detail.en
                : undefined;
              const inner = (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[row.date, detail, row.status === "upcoming" ? t.player.upcoming : t.player.played]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              );
              return (
                <li key={row.id}>
                  {row.href ? (
                    <Link href={row.href} className="block hover:border-primary/40">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.player.recentRatingsTitle}
        </h2>
        {data?.recentRatings?.some((row) => row.source === "form") ? (
          <p className="mt-1 text-xs text-muted-foreground">{t.player.formNote}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{t.player.eventRankHint}</p>
        )}
        {!data?.recentRatings?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.player.noRatingsYet}</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {data.recentRatings.map((row) => {
              const title = locale === "zh" ? row.title.zh : row.title.en;
              const inner = (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{row.date}</p>
                  </div>
                  <Overall value={row.overall} />
                </div>
              );
              return (
                <li key={row.id}>
                  {row.href ? <Link href={row.href}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ol>
        )}
      </section>

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

    </div>
  );
}
