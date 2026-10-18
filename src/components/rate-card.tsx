"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommunityRatingsPanel,
  type RemoteComment,
  type RemoteRating,
} from "@/components/community-ratings-panel";
import { GradeSlider } from "@/components/grade-slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Overall } from "@/components/score-rows";
import { useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/data";
import { dimLabel } from "@/i18n/position-dims";
import {
  commentsFor,
  emptyScores,
  getUserRating,
  mergedAverages,
  overallFromScores,
} from "@/lib/store";
import { dimensionIds } from "@/lib/position-ratings";
import type {
  Athlete,
  Localized,
  MatchEvent,
  Performance,
  ScoreMap,
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
  const { user, enabled: authEnabled } = useAuth();
  const userId = user?.id;
  const { state, postTake } = useCommunity();
  const positionKey = performance.positionKey;
  const dims = dimensionIds(positionKey);
  const localMine = getUserRating(state, event.id, athlete.id);
  const merged = mergedAverages(event, athlete.id, state);
  const localComments = commentsFor(event.id, athlete.id, state);

  const [remoteComments, setRemoteComments] = useState<RemoteComment[]>([]);
  const [remoteRatings, setRemoteRatings] = useState<RemoteRating[]>([]);
  const [remoteMine, setRemoteMine] = useState<ScoreMap | null>(null);
  const [remoteCommunityAvg, setRemoteCommunityAvg] = useState<ScoreMap | null>(
    null,
  );

  const loadRemote = useCallback(async () => {
    if (!authEnabled) return;
    const qs = new URLSearchParams({ positionKey });
    const res = await fetch(
      `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(athlete.id)}?${qs}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      comments: RemoteComment[];
      ratings: RemoteRating[];
      mine: ScoreMap | null;
      communityAvg: ScoreMap | null;
    };
    setRemoteComments(data.comments ?? []);
    setRemoteRatings(data.ratings ?? []);
    setRemoteMine(data.mine);
    setRemoteCommunityAvg(data.communityAvg ?? null);
  }, [athlete.id, authEnabled, event.id, positionKey]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const mine =
    authEnabled && remoteMine
      ? { eventId: event.id, athleteId: athlete.id, scores: remoteMine, updatedAt: "" }
      : localMine;

  const panelRatings = useMemo((): RemoteRating[] => {
    if (authEnabled) return remoteRatings;
    const entry = getUserRating(state, event.id, athlete.id);
    if (!entry) return [];
    return [
      {
        userId: "local",
        author: state.nickname,
        scores: entry.scores,
        updatedAt: entry.updatedAt,
        isYou: true,
      },
    ];
  }, [authEnabled, athlete.id, event.id, remoteRatings, state]);

  const panelComments = useMemo((): RemoteComment[] => {
    if (authEnabled) return remoteComments;
    return localComments.map((c) => {
      const isLocalUser = "local" in c && c.local;
      const isYou =
        isLocalUser && c.author === state.nickname;
      return {
        id: c.id,
        author: c.author,
        body: isLocalUser ? c.body : tx(c.body as Localized, locale),
        createdAt: c.createdAt,
        isYou,
      };
    });
  }, [
    authEnabled,
    localComments,
    locale,
    remoteComments,
    state.nickname,
  ]);

  const displayMerged = useMemo(() => {
    if (authEnabled && remoteCommunityAvg && remoteRatings.length > 0) {
      return {
        avg: remoteCommunityAvg,
        count: remoteRatings.length,
        mine: remoteMine,
      };
    }
    return merged;
  }, [
    authEnabled,
    merged,
    remoteCommunityAvg,
    remoteMine,
    remoteRatings.length,
  ]);

  const cloudPost = authEnabled && isSupabaseConfigured();
  const mustSignIn = cloudPost && !user;

  const [draft, setDraft] = useState<ScoreMap | null>(null);
  const baseScores = {
    ...emptyScores(event.sport, positionKey),
    ...(mine?.scores ?? {}),
  };
  const scores = draft ?? baseScores;
  const [body, setBody] = useState("");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? state.nickname;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchScore(id: string, next: number) {
    setDraft((prev) => {
      const base = prev ?? baseScores;
      return { ...base, [id]: next };
    });
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-6">
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
        {displayMerged && (
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{t.rate.community}</p>
            <Overall value={overallScore(displayMerged.avg, positionKey)} />
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-6">{tx(performance.highlight, locale)}</p>

      {displayMerged && (
        <div className="mt-4 rounded-lg bg-muted/60 p-3">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {t.rate.community}
            {authEnabled && remoteRatings.length > 0 ? (
              <span className="ml-1 font-normal normal-case text-muted-foreground">
                ({remoteRatings.length})
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dims.map((id) => (
              <span key={id} className="rounded-md bg-background px-2 py-1 text-xs">
                {dimLabel(locale, positionKey, id)}{" "}
                <span className="font-semibold tabular-nums">
                  {(displayMerged.avg[id] ?? 0).toFixed(1)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <form
        className="mt-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (mustSignIn) {
            setError(t.auth.signInToPost);
            return;
          }
          if (body.trim() && body.trim().length < 8) {
            setError(t.rate.needComment);
            return;
          }
          if (cloudPost && user) {
            const res = await fetch("/api/community/post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventId: event.id,
                athleteId: athlete.id,
                sport: event.sport,
                positionKey,
                scores,
                comment: body,
                displayName: name,
              }),
            });
            if (!res.ok) {
              const data = (await res.json()) as { error?: string };
              setError(data.error ?? t.auth.failed);
              return;
            }
            await loadRemote();
          } else {
            postTake(event.id, athlete.id, scores, body, name);
          }
          setDraft(null);
          setBody("");
          setError(null);
          setSaved(true);
          queueMicrotask(() => {
            document.getElementById("community-board")?.scrollIntoView({
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
              {overallFromScores(scores, positionKey).toFixed(1)}
            </span>
          </div>
          <p className="mb-2 text-[11px] text-muted-foreground">{t.rate.overallWeighted}</p>
          <div className="space-y-3">
            {dims.map((id) => (
              <GradeSlider
                key={id}
                label={dimLabel(locale, positionKey, id)}
                value={scores[id] ?? 7}
                onChange={(next) => patchScore(id, next)}
              />
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
            <input
              id="handle"
              value={name}
              maxLength={16}
              onChange={(e) => setNameDraft(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {mustSignIn && (
          <p className="text-sm text-muted-foreground">
            {t.auth.signInToPost}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t.auth.signIn}
            </Link>
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={mustSignIn}>
          {t.rate.post}
        </Button>
        {saved && <p className="text-center text-sm text-primary">{t.rate.posted}</p>}
      </form>

      <CommunityRatingsPanel
        positionKey={positionKey}
        dimIds={[...dims]}
        ratings={panelRatings}
        comments={panelComments}
      />
    </div>
  );
}
