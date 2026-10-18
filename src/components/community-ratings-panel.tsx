"use client";

import { useMemo, useState } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { Overall } from "@/components/score-rows";
import { useI18n } from "@/i18n/use-i18n";
import { formatWhen, meanScore } from "@/lib/data";
import { averageScores } from "@/lib/score-aggregate";
import type { ScoreMap, Sport } from "@/lib/types";

export type RemoteRating = {
  userId: string;
  author: string;
  scores: ScoreMap;
  updatedAt: string;
  isYou: boolean;
};

export type RemoteComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  scores?: ScoreMap;
  userId?: string;
  isYou: boolean;
};

type Filter = "all" | "mine" | "others";

export function CommunityRatingsPanel({
  sport,
  dimIds,
  ratings,
  comments,
}: {
  sport: Sport;
  dimIds: string[];
  ratings: RemoteRating[];
  comments: RemoteComment[];
}) {
  const { locale, t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const dimLabels = dimIds.map((id) => t.dims[sport][id]);

  const communityAvg = useMemo(
    () => averageScores(ratings.map((r) => r.scores), dimIds),
    [ratings, dimIds],
  );

  const mineRating = ratings.find((r) => r.isYou);

  const filteredRatings = ratings.filter((r) => {
    if (filter === "mine") return r.isYou;
    if (filter === "others") return !r.isYou;
    return true;
  });

  const filteredComments = comments.filter((c) => {
    if (filter === "mine") return c.isYou;
    if (filter === "others") return !c.isYou;
    return true;
  });

  const radarSeries = useMemo(() => {
    const out: {
      label: string;
      scores: ScoreMap;
      stroke: string;
      fill: string;
    }[] = [];
    if (communityAvg && ratings.length > 0) {
      out.push({
        label: t.rate.community,
        scores: communityAvg,
        stroke: "oklch(0.58 0.19 38)",
        fill: "oklch(0.58 0.19 38 / 0.2)",
      });
    }
    if (mineRating) {
      out.push({
        label: t.rate.you,
        scores: mineRating.scores,
        stroke: "oklch(0.45 0.12 250)",
        fill: "oklch(0.45 0.12 250 / 0.25)",
      });
    }
    return out;
  }, [communityAvg, mineRating, ratings.length, t.rate.community, t.rate.you]);

  if (ratings.length === 0 && comments.length === 0) {
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
            {communityAvg && ratings.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {t.rate.community}{" "}
                <span className="font-semibold tabular-nums">
                  {meanScore(communityAvg).toFixed(1)}
                </span>
                <span className="text-muted-foreground">({ratings.length})</span>
              </span>
            )}
            {mineRating && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-700" />
                {t.rate.you}{" "}
                <span className="font-semibold tabular-nums">
                  {meanScore(mineRating.scores).toFixed(1)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {filteredRatings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t.rate.allRatings}
          </h3>
          <ul className="space-y-2">
            {filteredRatings.map((r) => (
              <li
                key={r.userId}
                className={`rounded-lg border bg-card p-3 ${r.isYou ? "border-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {r.author}
                      {r.isYou ? ` · ${t.rate.you}` : ""}
                    </p>
                    <time className="text-[11px] text-muted-foreground">
                      {formatWhen(r.updatedAt, locale)}
                    </time>
                  </div>
                  <Overall value={meanScore(r.scores)} />
                </div>
                <div className="mt-3 flex justify-center sm:justify-start">
                  <DimensionRadar
                    dimIds={dimIds}
                    dimLabels={dimLabels}
                    series={[
                      {
                        label: r.author,
                        scores: r.scores,
                        stroke: r.isYou ? "oklch(0.45 0.12 250)" : "oklch(0.55 0.02 40)",
                        fill: r.isYou
                          ? "oklch(0.45 0.12 250 / 0.25)"
                          : "oklch(0.55 0.02 40 / 0.15)",
                      },
                    ]}
                    size={180}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.rate.takes}
        </h3>
        <ul id="takes-list" className="space-y-3">
          {filteredComments.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              {t.rate.noCommentsInFilter}
            </li>
          ) : (
            filteredComments.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg border bg-card p-3 ${c.isYou ? "border-primary/40" : ""}`}
              >
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {c.author}
                    {c.isYou ? ` · ${t.rate.you}` : ""}
                  </span>
                  <time>{formatWhen(c.createdAt, locale)}</time>
                </div>
                <p className="mt-2 text-sm leading-6">{c.body}</p>
                {c.scores && (
                  <div className="mt-3 border-t pt-3">
                    <DimensionRadar
                      dimIds={dimIds}
                      dimLabels={dimLabels}
                      series={[
                        {
                          label: c.author,
                          scores: c.scores,
                          stroke: "oklch(0.58 0.19 38)",
                          fill: "oklch(0.58 0.19 38 / 0.15)",
                        },
                      ]}
                      size={160}
                    />
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
