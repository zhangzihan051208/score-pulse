"use client";

import { useMemo, useState, type FormEvent } from "react";
import { GradeSlider } from "@/components/grade-slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { scanCommentBody } from "@/lib/comment-moderation";
import { moderationI18nKey } from "@/lib/content-moderation";
import { tx } from "@/lib/copy";
import { seedMatchTakes } from "@/lib/match-takes";
import { moderationMessage } from "@/lib/moderation-message";
import { clampScore } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

export function MatchTakePanel({ event }: { event: MatchEvent }) {
  const { locale, t } = useI18n();
  const { state, postMatchTake } = useCommunity();
  const mine = state.matchTakes[event.id];
  const [score, setScore] = useState(() => clampScore(mine?.score ?? 7.5));
  const [body, setBody] = useState(() => mine?.body ?? "");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = nameDraft ?? state.nickname;

  const seeds = useMemo(
    () => seedMatchTakes.filter((take) => take.eventId === event.id),
    [event.id],
  );

  const rows = useMemo(() => {
    const yours = mine
      ? [
          {
            id: mine.id,
            author: mine.author,
            score: mine.score,
            body: mine.body,
            createdAt: mine.createdAt,
            isYou: true,
          },
        ]
      : [];
    const others = seeds.map((take) => ({
      id: take.id,
      author: take.author,
      score: take.score,
      body: tx(take.body, locale),
      createdAt: take.createdAt,
      isYou: false,
    }));
    return [...yours, ...others].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [locale, mine, seeds]);

  const average = rows.length
    ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length
    : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    const verdict = scanCommentBody(trimmed);
    if (!verdict.pass) {
      setSaved(false);
      setError(moderationMessage(t.moderation, moderationI18nKey(verdict.codes)));
      return;
    }
    postMatchTake(event.id, score, trimmed, name);
    setSaved(true);
    setError(null);
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t.event.matchTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.event.matchLead}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t.event.matchAverage}</p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            {average == null ? "—" : average.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.event.matchCount.replace("{n}", String(rows.length))}
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <GradeSlider label={t.event.matchScore} value={score} onChange={(next) => {
          setScore(next);
          setSaved(false);
        }} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="match-comment">
            {t.event.matchComment}
          </label>
          <Textarea
            id="match-comment"
            value={body}
            placeholder={t.event.matchCommentHint}
            onChange={(e) => {
              setBody(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="match-name">
              {t.rate.nickname}
            </label>
            <input
              id="match-name"
              value={name}
              maxLength={16}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setSaved(false);
              }}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" size="lg" className="sm:min-w-28">
            {t.event.matchPost}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-primary">{t.event.matchPosted}</p> : null}
      </form>

      <div className="mt-5">
        <h3 className="text-sm font-medium">{t.event.matchComment}</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.event.matchEmpty}</p>
        ) : (
          <ul className="mt-2 divide-y">
            {rows.map((row) => (
              <li key={row.id} className="flex gap-3 py-3">
                <span className="w-10 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-primary">
                  {row.score.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {row.isYou ? `${t.event.matchYou} · ${row.author}` : row.author}
                    {" · "}
                    {new Date(row.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm leading-6">
                    {row.body || t.event.matchScoreOnly}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
