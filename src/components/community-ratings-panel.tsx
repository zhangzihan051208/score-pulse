"use client";

import { useMemo, useState } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { Overall } from "@/components/score-rows";
import { dimLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { formatWhen, overallScore } from "@/lib/data";
import { overallFromScores } from "@/lib/store";
import { averageScores } from "@/lib/score-aggregate";
import { CommentTakeActions } from "@/components/comment-take-actions";
import type { CommunityTake } from "@/lib/community-take-types";
import type { PositionKey, ScoreMap } from "@/lib/types";

export type { CommunityTake };

type Filter = "all" | "mine" | "others";

export function CommunityRatingsPanel({
  positionKey,
  dimIds,
  takes,
  onRefresh,
}: {
  positionKey: PositionKey;
  dimIds: string[];
  takes: CommunityTake[];
  onRefresh?: () => void;
}) {
  const { locale, t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const dimLabels = dimIds.map((id) => dimLabel(locale, positionKey, id));

  const communityAvg = useMemo(
    () => averageScores(takes.map((row) => row.scores), dimIds),
    [takes, dimIds],
  );

  const mineTake = takes.find((row) => row.isYou);

  const filtered = takes.filter((row) => {
    if (filter === "mine") return row.isYou;
    if (filter === "others") return !row.isYou;
    return true;
  });

  const radarSeries = useMemo(() => {
    const out: {
      label: string;
      scores: ScoreMap;
      stroke: string;
      fill: string;
    }[] = [];
    if (communityAvg && takes.length > 0) {
      out.push({
        label: t.rate.community,
        scores: communityAvg,
        stroke: "oklch(0.58 0.19 38)",
        fill: "oklch(0.58 0.19 38 / 0.32)",
      });
    }
    if (mineTake) {
      out.push({
        label: t.rate.you,
        scores: mineTake.scores,
        stroke: "oklch(0.45 0.12 250)",
        fill: "oklch(0.45 0.12 250 / 0.38)",
      });
    }
    return out;
  }, [communityAvg, mineTake, takes.length, t.rate.community, t.rate.you]);

  if (takes.length === 0) {
    return (
      <section className="mt-8 rounded-xl border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
        {t.rate.noCommunityYet}
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-4" id="community-board">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t.rate.communityBoard}</h2>
        <div className="flex gap-1 rounded-lg border p-0.5 text-xs">
          {(["all", "mine", "others"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-2 py-1 ${filter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {key === "all"
                ? t.rate.filterAll
                : key === "mine"
                  ? t.rate.filterMine
                  : t.rate.filterOthers}
            </button>
          ))}
        </div>
      </div>

      {radarSeries.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            {t.rate.radarLegend}
          </p>
          <DimensionRadar dimIds={dimIds} dimLabels={dimLabels} series={radarSeries} />
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
            {communityAvg && takes.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {t.rate.community}{" "}
                <span className="font-semibold tabular-nums">
                  {overallScore(communityAvg, positionKey).toFixed(1)}
                </span>
                <span className="text-muted-foreground">({takes.length})</span>
              </span>
            )}
            {mineTake && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-700" />
                {t.rate.you}{" "}
                <span className="font-semibold tabular-nums">
                  {overallFromScores(mineTake.scores, positionKey).toFixed(1)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.rate.takes}
        </h3>
        <ul id="takes-list" className="space-y-3">
          {filtered.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              {t.rate.noCommentsInFilter}
            </li>
          ) : (
            filtered.map((row) => (
              <li
                key={row.userId}
                className={`rounded-lg border bg-card p-3 ${row.isYou ? "border-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {row.author}
                      {row.isYou ? ` · ${t.rate.you}` : ""}
                    </p>
                    <time className="text-[11px] text-muted-foreground">
                      {formatWhen(row.updatedAt, locale)}
                    </time>
                  </div>
                  <Overall value={overallFromScores(row.scores, positionKey)} />
                </div>
                {row.body?.trim() ? (
                  <p className="mt-2 text-sm leading-6">{row.body}</p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{t.rate.scoreOnly}</p>
                )}
                <CommentTakeActions take={row} onChange={onRefresh} />
                <div className="mt-3 border-t pt-3">
                  <DimensionRadar
                    dimIds={dimIds}
                    dimLabels={dimLabels}
                    series={[
                      {
                        label: row.author,
                        scores: row.scores,
                        stroke: row.isYou
                          ? "oklch(0.45 0.12 250)"
                          : "oklch(0.55 0.02 40)",
                        fill: row.isYou
                          ? "oklch(0.45 0.12 250 / 0.25)"
                          : "oklch(0.55 0.02 40 / 0.15)",
                      },
                    ]}
                    size={180}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
