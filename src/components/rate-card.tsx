"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Overall, ScoreRows } from "@/components/score-rows";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { formatWhen, meanScore } from "@/lib/data";
import {
  clampScore,
  commentsFor,
  emptyScores,
  getUserRating,
  mergedAverages,
} from "@/lib/store";
import { SPORT_DIMENSIONS } from "@/lib/sports";
import type {
  Athlete,
  Locale,
  Localized,
  MatchEvent,
  Performance,
  ScoreMap,
  SeedComment,
  UserComment,
} from "@/lib/types";

export function RateCard({
  event,
  athlete,
  performance,
}: {
  event: MatchEvent;
  athlete: Athlete;
  performance: Performance;
}) {
  const { locale, t } = useI18n();
  const { state, setNickname, postTake } = useCommunity();
  const dims = SPORT_DIMENSIONS[event.sport];
  const mine = getUserRating(state, event.id, athlete.id);
  const merged = mergedAverages(event, athlete.id, state);
  const comments = commentsFor(event.id, athlete.id, state);

  const [draft, setDraft] = useState<ScoreMap | null>(null);
  const scores = draft ?? mine?.scores ?? emptyScores(event.sport);
  const [body, setBody] = useState("");
  const [name, setName] = useState(state.nickname);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-xl px-3 py-6">
      <Link
        href={`/events/${event.slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {t.rate.back}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {t.sports[event.sport]} · {tx(event.title, locale)}
          </p>
          <h1 className="text-2xl font-bold">{athlete.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tx(performance.role, locale)}
            {performance.result ? ` · ${tx(performance.result, locale)}` : ""}
          </p>
        </div>
        {merged && (
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{t.rate.community}</p>
            <Overall value={meanScore(merged.avg)} />
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-6">{tx(performance.highlight, locale)}</p>

      {merged && (
        <div className="mt-4 rounded-lg bg-muted/60 p-3">
          <ScoreRows sport={event.sport} scores={merged.avg} compact />
        </div>
      )}

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim() && body.trim().length < 8) {
            setError(t.rate.needComment);
            return;
          }
          setNickname(name);
          postTake(event.id, athlete.id, scores, body);
          setBody("");
          setError(null);
          setSaved(true);
          queueMicrotask(() => {
            document.getElementById("takes")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }}
      >
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">{t.rate.yourTake}</h2>
            <span className="text-lg font-bold tabular-nums text-primary">
              {meanScore(scores).toFixed(1)}
            </span>
          </div>
          <div className="space-y-4">
            {dims.map((id) => (
              <div key={id} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3">
                <label className="text-sm font-medium">{t.dims[event.sport][id]}</label>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={[scores[id] ?? 7]}
                  onValueChange={(v) => {
                    const n = Array.isArray(v) ? v[0] : Number(v);
                    setDraft({ ...scores, [id]: clampScore(n) });
                    setSaved(false);
                  }}
                />
                <span className="text-right text-sm font-semibold tabular-nums">
                  {(scores[id] ?? 7).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t.rate.comment}</label>
          <Textarea
            value={body}
            placeholder={t.rate.commentHint}
            onChange={(e) => {
              setBody(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="handle">
              {t.rate.nickname}
            </label>
            <Input
              id="handle"
              value={name}
              maxLength={16}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full">
          {t.rate.post}
        </Button>
        {saved && <p className="text-center text-sm text-primary">{t.rate.posted}</p>}
      </form>

      <h2 id="takes" className="mt-8 text-sm font-semibold">
        {t.rate.takes}
      </h2>
      <ul className="mt-3 space-y-3">
        {comments.length === 0 ? (
          <li className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
            {t.rate.noComments}
          </li>
        ) : (
          comments.map((comment) => {
            const minePost = "local" in comment && comment.local;
            return (
              <li
                key={comment.id}
                className={`rounded-lg border bg-card p-3 ${minePost ? "border-primary/40" : ""}`}
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.author}
                    {minePost ? ` · ${t.rate.you}` : ""}
                  </span>
                  <time>{formatWhen(comment.createdAt, locale)}</time>
                </div>
                <p className="mt-2 text-sm leading-6">
                  {commentBody(comment, locale)}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function commentBody(comment: SeedComment | UserComment, locale: Locale) {
  if ("local" in comment && comment.local) return comment.body;
  return tx(comment.body as Localized, locale);
}
