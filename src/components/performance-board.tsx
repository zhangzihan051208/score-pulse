"use client";

import { useMemo } from "react";
import Link from "next/link";
import { NicknameBar } from "@/components/nickname-bar";
import { OverallPill, ScoreMeter } from "@/components/score-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommunity } from "@/hooks/use-community";
import { athletes } from "@/lib/data";
import { mergedAverages } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

export function PerformanceBoard({ event }: { event: MatchEvent }) {
  const { state, ready, setNickname } = useCommunity();

  const rows = useMemo(
    () =>
      event.performances.map((p) => ({
        performance: p,
        athlete: athletes[p.athleteId],
        merged: mergedAverages(event, p.athleteId, state),
      })),
    [event, state],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>你的看台身份</CardTitle>
        </CardHeader>
        <CardContent>
          {ready ? (
            <NicknameBar nickname={state.nickname} onSave={setNickname} />
          ) : (
            <p className="text-sm text-muted-foreground">正在读取本机记录…</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {rows.map(({ performance, athlete, merged }) => {
          if (!athlete || !merged) return null;
          return (
            <Card key={athlete.id}>
              <CardContent className="grid gap-5 pt-1 md:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        {athlete.shortName}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold">{athlete.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {athlete.team ?? athlete.country} · {performance.role}
                          {performance.result ? ` · ${performance.result}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">社区整体</p>
                      <OverallPill value={merged.avg.overall} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {merged.count.toLocaleString("zh-CN")} 人
                      </p>
                    </div>
                  </div>
                  <p className="leading-6">{performance.highlight}</p>
                  <dl className="flex flex-wrap gap-2">
                    {performance.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg bg-muted px-2.5 py-1 text-xs"
                      >
                        <span className="text-muted-foreground">{stat.label} </span>
                        <span className="font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </dl>
                  <Button render={<Link href={`/events/${event.slug}/${athlete.id}`} />}>
                    打分并评论
                  </Button>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {merged.mine ? "计入你的分数后" : "社区均分"}
                  </p>
                  <ScoreMeter scores={merged.avg} compact />
                  {merged.mine && (
                    <p className="mt-3 text-xs text-primary">
                      你的整体 {merged.mine.overall.toFixed(1)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
