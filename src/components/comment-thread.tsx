"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { athletes, events, formatWhen } from "@/lib/data";
import type { ScoreMap, SeedComment } from "@/lib/types";

export function CommentThread({
  comments,
  nickname,
  disabled,
  attachScores,
  onSubmit,
}: {
  comments: SeedComment[];
  nickname: string;
  disabled?: boolean;
  attachScores?: Partial<ScoreMap> | null;
  onSubmit: (body: string, withScores: boolean) => void;
}) {
  const [body, setBody] = useState("");
  const [withScores, setWithScores] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim().length < 8) {
            setError("请写清你看到的具体表现，至少 8 个字。");
            return;
          }
          onSubmit(body, withScores && Boolean(attachScores));
          setBody("");
          setError(null);
        }}
      >
        <Textarea
          value={body}
          disabled={disabled}
          placeholder={`以「${nickname}」发表。尽量写动作、回合、决策，而不是只写赢了/输了。`}
          onChange={(e) => setBody(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={withScores}
            onChange={(e) => setWithScores(e.target.checked)}
          />
          附上我刚打的分数
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={disabled}>
          发布评论
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          还没有评论。先写一条你看见的具体回合。
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{comment.author}</span>
                <time className="text-xs text-muted-foreground">
                  {formatWhen(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 leading-6">{comment.body}</p>
              {comment.scores && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {Object.entries(comment.scores)
                    .map(([k, v]) => `${labelOf(k)} ${Number(v).toFixed(1)}`)
                    .join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function labelOf(id: string) {
  const map: Record<string, string> = {
    technique: "技术",
    tactics: "战术",
    fitness: "体能",
    mentality: "心态",
    overall: "整体",
  };
  return map[id] ?? id;
}

export function FeedLine({
  eventId,
  athleteId,
}: {
  eventId: string;
  athleteId: string;
}) {
  const event = events.find((e) => e.id === eventId);
  const athlete = athletes[athleteId];
  if (!event || !athlete) return null;
  return (
    <span>
      {event.title} · {athlete.name}
    </span>
  );
}
