"use client";

import Link from "next/link";
import { NicknameBar } from "@/components/nickname-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommunity } from "@/hooks/use-community";
import { athletes, events, formatWhen } from "@/lib/data";
import { allFeedItems } from "@/lib/store";

export function CommunityFeed({ limit }: { limit?: number }) {
  const { state, ready, setNickname } = useCommunity();
  const items = ready ? allFeedItems(state).slice(0, limit ?? 40) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>本机身份</CardTitle>
        </CardHeader>
        <CardContent>
          {ready ? (
            <NicknameBar nickname={state.nickname} onSave={setNickname} />
          ) : (
            <p className="text-sm text-muted-foreground">读取中…</p>
          )}
        </CardContent>
      </Card>

      {!ready ? (
        <p className="text-sm text-muted-foreground">正在载入社区动态…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
          还没有动态。去一场赛事给选手打分。
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const event = events.find((e) => e.id === item.eventId);
            const athlete = athletes[item.athleteId];
            if (!event || !athlete) return null;
            const href = `/events/${event.slug}/${athlete.id}`;
            return (
              <li key={`${item.kind}-${"id" in item ? item.id : index}`}>
                <Link href={href} className="block">
                  <Card className="transition hover:ring-primary/30">
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {item.kind === "comment" ? "评论" : "评分"} · {item.author} ·{" "}
                          {athlete.name}
                        </span>
                        <time>{formatWhen(item.at)}</time>
                      </div>
                      <p className="font-medium">{event.title}</p>
                      {"body" in item && item.body ? (
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {item.body}
                        </p>
                      ) : "scores" in item && item.scores ? (
                        <p className="text-sm text-muted-foreground">
                          整体 {Number(item.scores.overall).toFixed(1)} · 技术{" "}
                          {Number(item.scores.technique).toFixed(1)} · 战术{" "}
                          {Number(item.scores.tactics).toFixed(1)}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
