"use client";

import Link from "next/link";
import { CommentThread } from "@/components/comment-thread";
import { NicknameBar } from "@/components/nickname-bar";
import { OverallPill, ScoreMeter } from "@/components/score-meter";
import { ScorePanel } from "@/components/score-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCommunity } from "@/hooks/use-community";
import { commentsFor, getUserRating, mergedAverages } from "@/lib/store";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

export function PerformanceStudio({
  event,
  athlete,
  performance,
}: {
  event: MatchEvent;
  athlete: Athlete;
  performance: Performance;
}) {
  const { state, ready, setNickname, saveRating, addComment } = useCommunity();
  const merged = mergedAverages(event, athlete.id, state);
  const mine = getUserRating(state, event.id, athlete.id);
  const comments = commentsFor(event.id, athlete.id, state);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>本场表现卡</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                  {athlete.shortName}
                </span>
                <div>
                  <h1 className="text-2xl font-semibold">{athlete.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {event.title} · {performance.role}
                  </p>
                </div>
              </div>
              {merged && <OverallPill value={merged.avg.overall} />}
            </div>
            <p className="leading-7">{performance.highlight}</p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {performance.stats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-muted p-3">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-medium">{stat.value}</dd>
                </div>
              ))}
            </dl>
            {merged && <ScoreMeter scores={merged.avg} />}
            <Button variant="outline" render={<Link href={`/events/${event.slug}`} />}>
              返回赛事名单
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>社区评论</CardTitle>
          </CardHeader>
          <CardContent>
            {ready ? (
              <CommentThread
                comments={comments}
                nickname={state.nickname}
                attachScores={mine?.scores}
                onSubmit={(body, withScores) =>
                  addComment(
                    event.id,
                    athlete.id,
                    body,
                    withScores ? mine?.scores : undefined,
                  )
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">正在载入评论…</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>你的五维评分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ready ? (
              <>
                <NicknameBar nickname={state.nickname} onSave={setNickname} />
                <Separator />
                <ScorePanel
                  key={mine?.updatedAt ?? "new"}
                  initial={mine?.scores}
                  onSubmit={(scores) => saveRating(event.id, athlete.id, scores)}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">正在读取你上次的分数…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
