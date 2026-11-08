"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CommentBody } from "@/components/comment-body";
import { GradeSlider } from "@/components/grade-slider";
import { SafetyActions } from "@/components/safety-actions";
import { TeamCrest } from "@/components/team-crest";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import { useLivePoll } from "@/hooks/use-live-poll";
import { useI18n } from "@/i18n/use-i18n";
import { scanCommentBody } from "@/lib/comment-moderation";
import { moderationI18nKey } from "@/lib/content-moderation";
import { moderationMessage } from "@/lib/moderation-message";
import { clampScore } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

function isAccountId(id?: string) {
  return Boolean(
    id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
}

type RemoteTake = {
  userId: string;
  author: string;
  score: number;
  body: string;
  bodyOriginal?: string;
  commentId?: string;
  createdAt: string;
  isYou: boolean;
  primaryCrestUrl?: string | null;
  primaryCrestName?: string | null;
  editorial?: boolean;
};

export function MatchTakePanel({ event }: { event: MatchEvent }) {
  const { locale, t } = useI18n();
  const { user, enabled } = useAuth();
  const { state, postMatchTake } = useCommunity();
  const mine = state.matchTakes[event.id];
  const [remote, setRemote] = useState<RemoteTake[] | null>(null);
  const [score, setScore] = useState(() => clampScore(mine?.score ?? 7.5));
  const [body, setBody] = useState(() => mine?.body ?? "");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = nameDraft ?? state.nickname;

  const loadRemote = useCallback(() => {
    if (!enabled) return;
    fetch(
      `/api/community/match?eventId=${encodeURIComponent(event.id)}&locale=${encodeURIComponent(locale)}`,
      { cache: "no-store" },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { takes?: RemoteTake[] } | null) => {
        setRemote(data?.takes ?? []);
      })
      .catch(() => setRemote([]));
  }, [enabled, event.id, locale]);

  useLivePoll(loadRemote, enabled);

  useEffect(() => {
    if (saved) loadRemote();
  }, [loadRemote, saved]);

  const rows = useMemo(() => {
    const cloudRows = (remote ?? []).map((take) => ({
      id: take.userId,
      author: take.author,
      score: take.score,
      body: take.body,
      bodyOriginal: take.bodyOriginal,
      createdAt: take.createdAt,
      isYou: take.isYou,
      userId: take.userId,
      commentId: take.commentId,
      primaryCrestUrl: take.primaryCrestUrl,
      primaryCrestName: take.primaryCrestName,
      editorial: take.editorial,
    }));
    const cloudHasYou = cloudRows.some((take) => take.isYou);
    const yours =
      mine && !cloudHasYou
        ? [
            {
              id: mine.id,
              author: mine.author,
              score: mine.score,
              body: mine.body,
              bodyOriginal: undefined as string | undefined,
              createdAt: mine.createdAt,
              isYou: true,
              userId: undefined as string | undefined,
              commentId: undefined as string | undefined,
              primaryCrestUrl: null,
              primaryCrestName: null,
              editorial: false,
            },
          ]
        : [];
    return [...cloudRows, ...yours].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [mine, remote]);

  const average = rows.length
    ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length
    : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    const verdict = scanCommentBody(trimmed);
    if (!verdict.pass) {
      setSaved(false);
      setError(moderationMessage(t.moderation, moderationI18nKey(verdict.codes)));
      return;
    }
    if (enabled && user) {
      const res = await fetch("/api/community/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          sport: event.sport,
          score,
          comment: trimmed,
          displayName: name,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { messageKey?: string; error?: string } | null;
        setSaved(false);
        setError(
          data?.messageKey
            ? moderationMessage(t.moderation, data.messageKey)
            : (data?.error ?? t.safety.failed),
        );
        return;
      }
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

      <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
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
            maxLength={500}
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
        {enabled && !user ? (
          <p className="text-sm text-muted-foreground">{t.safety.signInToPublish}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-primary">{t.event.matchPosted}</p> : null}
      </form>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">{t.event.matchComment}</h3>
          {rows.some((row) => row.editorial) ? (
            <p className="text-[11px] text-muted-foreground">{t.event.sheetNote}</p>
          ) : null}
        </div>
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
                  <div className="flex items-start justify-between gap-2">
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
                    {row.primaryCrestUrl ? (
                      <TeamCrest
                        name={row.primaryCrestName ?? row.author}
                        badgeUrl={row.primaryCrestUrl}
                        size="sm"
                        className="rounded-sm"
                      />
                    ) : null}
                  </div>
                  {row.body?.trim() ? (
                    <CommentBody
                      body={row.body}
                      bodyOriginal={row.bodyOriginal}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">{t.event.matchScoreOnly}</p>
                  )}
                  {!row.isYou && (isAccountId(row.userId) || row.commentId) ? (
                    <SafetyActions
                      targetUserId={isAccountId(row.userId) ? row.userId : undefined}
                      commentId={row.commentId}
                      eventId={event.id}
                      excerpt={row.body}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
