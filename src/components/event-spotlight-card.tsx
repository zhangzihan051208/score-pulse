"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { DimensionRadar } from "@/components/dimension-radar";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { useAuth } from "@/hooks/use-auth";
import { dimLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/data";
import { playerRoleSubtitle } from "@/lib/player-meta";
import {
  localTakesForAthlete,
  pickEventSpotlights,
  radarDimIds,
  topEngagementTake,
  type SpotlightPick,
} from "@/lib/event-spotlight";
import { averageScores } from "@/lib/score-aggregate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CommunityState } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

export function EventSpotlightCard({
  event,
  pick,
  state,
  compact = false,
}: {
  event: MatchEvent;
  pick: SpotlightPick;
  state: CommunityState;
  compact?: boolean;
}) {
  const { locale, t } = useI18n();
  const { enabled: authEnabled } = useAuth();
  const [remoteTakes, setRemoteTakes] = useState<CommunityTake[]>([]);
  const positionKey = pick.performance.positionKey;
  const dimIds = radarDimIds(positionKey);

  useEffect(() => {
    if (!authEnabled || !isSupabaseConfigured()) return;
    const qs = new URLSearchParams({ positionKey });
    fetch(
      `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(pick.athlete.id)}?${qs}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { takes?: CommunityTake[] } | null) => {
        setRemoteTakes(d?.takes ?? []);
      });
  }, [authEnabled, event.id, pick.athlete.id, positionKey]);

  const takes = useMemo(() => {
    const local = localTakesForAthlete(event, pick.athlete.id, state, locale);
    if (remoteTakes.length > 0) return remoteTakes;
    return local;
  }, [event, locale, pick.athlete.id, remoteTakes, state]);

  const communityAvg = useMemo(
    () => averageScores(takes.map((row) => row.scores), dimIds),
    [dimIds, takes],
  );

  const avgForRadar =
    takes.length > 0 && communityAvg ? communityAvg : pick.merged.avg;
  const topTake = topEngagementTake(takes, positionKey);
  const dimLabels = dimIds.map((id) => dimLabel(locale, positionKey, id));

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <PlayerAvatar athlete={pick.athlete} size={compact ? "default" : "lg"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-semibold leading-tight">{pick.athlete.name}</h2>
              <p
                className="truncate text-xs text-muted-foreground"
                title={playerRoleSubtitle(
                  locale,
                  pick.athlete,
                  pick.performance,
                  positionKey,
                  {
                    prefix:
                      pick.side === "home"
                        ? t.event.homeSpotlight
                        : t.event.awaySpotlight,
                    includePositionGuide: false,
                  },
                )}
              >
                {playerRoleSubtitle(
                  locale,
                  pick.athlete,
                  pick.performance,
                  positionKey,
                  {
                    prefix:
                      pick.side === "home"
                        ? t.event.homeSpotlight
                        : t.event.awaySpotlight,
                    includePositionGuide: false,
                  },
                )}
              </p>
            </div>
            <div className="text-right">
              <Overall value={overallScore(avgForRadar, positionKey)} />
              <p className="text-[11px] text-muted-foreground">
                {Math.max(pick.merged.count, takes.length)} {t.event.ratings}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
        <DimensionRadar
          dimIds={dimIds}
          dimLabels={dimLabels}
          size={compact ? 200 : 220}
          series={[
            {
              label: t.rate.community,
              scores: avgForRadar,
              stroke: "oklch(0.58 0.19 38)",
              fill: "oklch(0.58 0.19 38 / 0.2)",
            },
          ]}
        />
        <div className="min-h-[5rem] rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t.event.hotTake}
          </p>
          {topTake?.body ? (
            <>
              <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed">{topTake.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">— {topTake.author}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t.event.noHotTake}</p>
          )}
        </div>
      </div>

      <Link
        href={`/events/${event.slug}/${pick.athlete.id}`}
        className="mt-4 inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
      >
        {t.event.viewPlayer}
      </Link>
    </article>
  );
}

export function EventSpotlightGrid({
  event,
  state,
  compact,
}: {
  event: MatchEvent;
  state: CommunityState;
  compact?: boolean;
}) {
  const { locale, t } = useI18n();
  const picks = pickEventSpotlights(event, state, locale);

  if (picks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t.event.spotlightEmpty}</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {picks.map((pick) => (
        <EventSpotlightCard
          key={pick.athlete.id}
          event={event}
          pick={pick}
          state={state}
          compact={compact}
        />
      ))}
    </div>
  );
}
