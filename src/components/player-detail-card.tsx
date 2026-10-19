"use client";

import Link from "next/link";
import { CommunityRatingsPanel } from "@/components/community-ratings-panel";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  DimensionChips,
  RatingGuidePanel,
} from "@/components/rating-guide-panel";
import { ScoreRows, Overall } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { usePlayerCommunity } from "@/hooks/use-player-community";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/data";
import { playerRoleSubtitle } from "@/lib/player-meta";
import { dimensionIds } from "@/lib/position-ratings";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

export function PlayerDetailCard({
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
  const dims = dimensionIds(positionKey);
  const { displayMerged, panelTakes } = usePlayerCommunity({
    event,
    athlete,
    performance,
    state,
    locale,
  });

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 pb-24">
      <Link
        href={`/events/${event.slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {t.rate.back}
      </Link>

      <div className="mt-4 flex gap-4">
        <PlayerAvatar athlete={athlete} size="lg" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {t.sports[event.sport]} · {tx(event.title, locale)}
          </p>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold leading-tight">{athlete.name}</h1>
              <p
                className="truncate text-sm text-muted-foreground"
                title={playerRoleSubtitle(locale, athlete, performance, positionKey)}
              >
                {playerRoleSubtitle(locale, athlete, performance, positionKey)}
              </p>
            </div>
            {displayMerged && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">{t.rate.community}</p>
                <Overall value={overallScore(displayMerged.avg, positionKey)} />
                <p className="text-[10px] text-muted-foreground">
                  {displayMerged.count.toLocaleString()} {t.event.ratings}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {tx(performance.highlight, locale)}
      </p>

      {displayMerged && (
        <div className="mt-5 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">{t.rate.detailScores}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.rate.overallWeighted}</p>
          <div className="mt-3">
            <ScoreRows positionKey={positionKey} scores={displayMerged.avg} />
          </div>
          <div className="mt-4 border-t pt-3">
            <DimensionChips positionKey={positionKey} scores={displayMerged.avg} />
          </div>
        </div>
      )}

      <div className="mt-4">
        <RatingGuidePanel positionKey={positionKey} />
      </div>

      <CommunityRatingsPanel
        positionKey={positionKey}
        dimIds={[...dims]}
        takes={panelTakes}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {t.rate.back}
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
