"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CommunityRatingsPanel,
  type CommunityTake,
} from "@/components/community-ratings-panel";
import { mergeTakes } from "@/lib/community-takes";
import { GradeSlider } from "@/components/grade-slider";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  DimensionChips,
  RatingGuidePanel,
} from "@/components/rating-guide-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Overall } from "@/components/score-rows";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useVipQuota } from "@/hooks/use-vip";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/data";
import { moderationMessage } from "@/lib/moderation-message";
import { athletePostMeta } from "@/lib/player-meta";
import { playerHubHref } from "@/lib/player-routes";
import { dimLabel, positionRoleLabel } from "@/i18n/position-dims";
import {
  commentsFor,
  emptyScores,
  getUserRating,
  mergedAverages,
  overallFromScores,
} from "@/lib/store";
import { dimensionIds } from "@/lib/position-ratings";
import {
  FREE_FULL_RATINGS_PER_DAY,
  isUniformOverallScores,
  scoresFromOverall,
  type RatingMode,
} from "@/lib/vip";
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
  const { profile } = useProfile();
  const { quota, cloud: vipCloud, reload: reloadVip } = useVipQuota();
  const { state, postTake } = useCommunity();
  const [draft, setDraft] = useState<ScoreMap | null>(null);
  const [ratingMode, setRatingMode] = useState<RatingMode>("full");
  const [body, setBody] = useState("");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentPrefilled = useRef(false);
  const positionKey = performance.positionKey;
  const dims = dimensionIds(positionKey);
  const localMine = getUserRating(state, event.id, athlete.id);
  const merged = mergedAverages(event, athlete.id, state);
  const localComments = commentsFor(event.id, athlete.id, state);

  const [remoteTakes, setRemoteTakes] = useState<CommunityTake[]>([]);
  const [remoteMine, setRemoteMine] = useState<ScoreMap | null>(null);
  const [remoteCommunityAvg, setRemoteCommunityAvg] = useState<ScoreMap | null>(
    null,
  );

  const cloudReads = isSupabaseConfigured();

  const loadRemote = useCallback(async () => {
    if (!cloudReads) return;
    const qs = new URLSearchParams({ positionKey });
    const res = await fetch(
      `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(athlete.id)}?${qs}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      takes: CommunityTake[];
      mine: ScoreMap | null;
      mineComment?: string;
      communityAvg: ScoreMap | null;
    };
    setRemoteTakes(data.takes ?? []);
    setRemoteMine(data.mine);
    setRemoteCommunityAvg(data.communityAvg ?? null);
    if (!commentPrefilled.current) {
      setBody(data.mineComment ?? "");
      commentPrefilled.current = true;
    }
  }, [athlete.id, cloudReads, event.id, positionKey]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const mine =
    user && remoteMine
      ? { eventId: event.id, athleteId: athlete.id, scores: remoteMine, updatedAt: "" }
      : !cloudReads
        ? localMine
        : undefined;

  const panelTakes = useMemo((): CommunityTake[] => {
    if (cloudReads) return remoteTakes;
    const entry = getUserRating(state, event.id, athlete.id);
    const ratingRows = entry
      ? [
          {
            userId: "local",
            author: state.nickname,
            scores: entry.scores,
            updatedAt: entry.updatedAt,
            isYou: true,
          },
        ]
      : [];
    const commentRows = localComments
      .filter((c) => c.scores || ("local" in c && c.local))
      .map((c) => {
        const isLocalUser = "local" in c && c.local;
        return {
          id: c.id,
          userId: isLocalUser ? "local" : c.id,
          author: c.author,
          body: isLocalUser ? c.body : tx(c.body as Localized, locale),
          createdAt: c.createdAt,
          scores: c.scores,
          isYou: isLocalUser && c.author === state.nickname,
        };
      });
    return mergeTakes(ratingRows, commentRows).map((t) => ({
      userId: t.userId,
      author: t.author,
      scores: t.scores,
      updatedAt: t.updatedAt,
      body: t.body,
      isYou: t.isYou,
    }));
  }, [
    athlete.id,
    cloudReads,
    event.id,
    localComments,
    locale,
    remoteTakes,
    state,
  ]);

  const displayMerged = useMemo(() => {
    if (cloudReads && remoteCommunityAvg && remoteTakes.length > 0) {
      return {
        avg: remoteCommunityAvg,
        count: remoteTakes.length,
        mine: remoteMine,
      };
    }
    return merged;
  }, [cloudReads, merged, remoteCommunityAvg, remoteMine, remoteTakes.length]);

  const cloudPost = isSupabaseConfigured();
  const mustSignIn = cloudPost && !user;

  const mineScores = mine?.scores;
  const alreadyFullCard =
    Boolean(mineScores) &&
    !isUniformOverallScores(mineScores!, [...dims]);

  const allowsFullDimensions =
    !vipCloud ||
    !cloudPost ||
    quota.isVip ||
    quota.fullRatingsRemaining > 0 ||
    alreadyFullCard;

  useEffect(() => {
    if (!allowsFullDimensions && ratingMode === "full") {
      setRatingMode("overall_only");
    }
  }, [allowsFullDimensions, ratingMode]);

  const baseScores = {
    ...emptyScores(event.sport, positionKey),
    ...(mine?.scores ?? {}),
  };
  const scores = draft ?? baseScores;
  const name =
    nameDraft ??
    (profile?.displayName && user ? profile.displayName : state.nickname);
  const hideNicknameField = Boolean(user && profile?.displayName);

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

      <div className="mt-4 flex gap-4">
        <PlayerAvatar athlete={athlete} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {t.sports[event.sport]} · {tx(event.title, locale)}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{athlete.name}</h1>
              <Link
                href={playerHubHref(event.sport, athlete.id)}
                className="text-xs text-primary hover:underline"
              >
                {t.player.profileLink}
              </Link>
              <p className="text-sm text-muted-foreground">
                {athlete.team ? `${athlete.team} · ` : ""}
                {tx(performance.role, locale)}
                {athlete.jerseyNumber ? ` · #${athlete.jerseyNumber}` : ""}
                {performance.result && !athlete.jerseyNumber
                  ? ` · ${tx(performance.result, locale)}`
                  : ""}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {positionRoleLabel(locale, positionKey)}
              </p>
            </div>
            {displayMerged && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">{t.rate.community}</p>
                <Overall value={overallScore(displayMerged.avg, positionKey)} />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {tx(performance.highlight, locale)}
      </p>

      <div className="mt-4">
        <RatingGuidePanel positionKey={positionKey} />
      </div>

      {displayMerged && (
        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            {t.rate.community}
            {cloudReads && remoteTakes.length > 0 ? (
              <span className="ml-1 font-normal">({remoteTakes.length})</span>
            ) : null}
          </p>
          <DimensionChips positionKey={positionKey} scores={displayMerged.avg} />
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
            const mode =
              allowsFullDimensions && ratingMode === "full"
                ? "full"
                : "overall_only";
            const res = await fetch("/api/community/post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventId: event.id,
                athleteId: athlete.id,
                sport: event.sport,
                positionKey,
                scores,
                ratingMode: mode,
                overall: overallFromScores(scores, positionKey),
                comment: body,
                displayName: name,
                ...athletePostMeta(event, athlete),
              }),
            });
            if (!res.ok) {
              const data = (await res.json()) as {
                error?: string;
                code?: string;
                messageKey?: string;
              };
              setError(
                data.code === "full_rating_limit"
                  ? t.rate.fullLimitError
                  : data.code === "moderation_blocked"
                    ? moderationMessage(t.moderation, data.messageKey)
                    : (data.error ?? t.auth.failed),
              );
              return;
            }
            await loadRemote();
            await reloadVip();
          } else if (!cloudPost) {
            postTake(event.id, athlete.id, scores, body, name);
            if (!body.trim()) setBody("");
          }
          setDraft(null);
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
        {cloudPost && user && vipCloud && !quota.isVip ? (
          <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {allowsFullDimensions
              ? t.rate.overallOnlyHint.replace(
                  "{limit}",
                  String(FREE_FULL_RATINGS_PER_DAY),
                )
              : t.rate.fullQuotaBanner
                  .replace("{used}", String(quota.fullRatingsToday))
                  .replace("{limit}", String(quota.fullRatingsLimit))}{" "}
            <Link href="/profile" className="font-medium text-primary hover:underline">
              VIP
            </Link>
          </p>
        ) : null}
        {cloudPost && user && quota.isVip ? (
          <p className="text-xs text-muted-foreground">{t.rate.vipWeightHint}</p>
        ) : null}

        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {ratingMode === "full" && allowsFullDimensions
                ? t.rate.yourScores
                : t.rate.overallOnly}
            </h2>
            {allowsFullDimensions && !quota.isVip && cloudPost && user ? (
              <div className="flex gap-1 rounded-lg border p-0.5 text-xs">
                <button
                  type="button"
                  className={
                    ratingMode === "full"
                      ? "rounded-md bg-primary px-2 py-0.5 text-primary-foreground"
                      : "px-2 py-0.5 text-muted-foreground"
                  }
                  onClick={() => setRatingMode("full")}
                >
                  {t.rate.yourScores}
                </button>
                <button
                  type="button"
                  className={
                    ratingMode === "overall_only"
                      ? "rounded-md bg-primary px-2 py-0.5 text-primary-foreground"
                      : "px-2 py-0.5 text-muted-foreground"
                  }
                  onClick={() => setRatingMode("overall_only")}
                >
                  {t.rate.overallOnly}
                </button>
              </div>
            ) : null}
            <span className="text-lg font-bold tabular-nums text-primary">
              {overallFromScores(scores, positionKey).toFixed(1)}
            </span>
          </div>
          {ratingMode === "full" && allowsFullDimensions ? (
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
          ) : (
            <GradeSlider
              label={t.rate.overallOnly}
              value={overallFromScores(scores, positionKey)}
              onChange={(next) => {
                setDraft({
                  ...baseScores,
                  ...scoresFromOverall(next, [...dims]),
                });
                setSaved(false);
              }}
            />
          )}
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

        {!hideNicknameField ? (
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
        ) : (
          <p className="text-xs text-muted-foreground">
            {t.rate.nickname}: {name}{" "}
            <Link href="/profile" className="text-primary hover:underline">
              {t.nav.profile}
            </Link>
          </p>
        )}

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
        takes={panelTakes}
        onRefresh={() => void loadRemote()}
      />
    </div>
  );
}
