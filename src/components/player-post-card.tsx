"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GradeSlider } from "@/components/grade-slider";
import { PlayerAvatar } from "@/components/player-avatar";
import { RatingGuidePanel } from "@/components/rating-guide-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCommunity } from "@/hooks/use-community";
import { usePlayerCommunity } from "@/hooks/use-player-community";
import { useProfile } from "@/hooks/use-profile";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel } from "@/i18n/position-dims";
import { tx } from "@/lib/copy";
import { emptyScores, overallFromScores } from "@/lib/store";
import { playerRoleSubtitle } from "@/lib/player-meta";
import { dimensionIds } from "@/lib/position-ratings";
import type { Athlete, MatchEvent, Performance, ScoreMap } from "@/lib/types";

export function PlayerPostCard({
  event,
  athlete,
  performance,
}: {
  event: MatchEvent;
  athlete: Athlete;
  performance: Performance;
}) {
  const { locale, t } = useI18n();
  const { state, postTake } = useCommunity();
  const { profile } = useProfile();
  const positionKey = performance.positionKey;
  const dims = dimensionIds(positionKey);
  const {
    mine,
    mineComment,
    loadRemote,
    cloudPost,
    mustSignIn,
    user,
  } = usePlayerCommunity({
    event,
    athlete,
    performance,
    state,
    locale,
  });

  const [draft, setDraft] = useState<ScoreMap | null>(null);
  const [body, setBody] = useState("");
  const commentPrefilled = useRef(false);
  useEffect(() => {
    if (commentPrefilled.current || !mineComment) return;
    setBody(mineComment);
    commentPrefilled.current = true;
  }, [mineComment]);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        href={`/events/${event.slug}/${athlete.id}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {t.rate.backToPlayer}
      </Link>

      <div className="mt-4 flex gap-3">
        <PlayerAvatar athlete={athlete} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{athlete.name}</h1>
          <p
            className="truncate text-sm text-muted-foreground"
            title={playerRoleSubtitle(locale, athlete, performance, positionKey, {
              prefix: tx(event.title, locale),
            })}
          >
            {playerRoleSubtitle(locale, athlete, performance, positionKey, {
              prefix: tx(event.title, locale),
            })}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <RatingGuidePanel positionKey={positionKey} />
      </div>

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
            if (!body.trim()) setBody("");
          }
          setDraft(null);
          setError(null);
          setSaved(true);
        }}
      >
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">{t.rate.yourScores}</h2>
            <span className="text-lg font-bold tabular-nums text-primary">
              {overallFromScores(scores, positionKey).toFixed(1)}
            </span>
          </div>
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
        {saved && (
          <p className="text-center text-sm text-primary">
            {t.rate.posted}{" "}
            <Link
              href={`/events/${event.slug}/${athlete.id}`}
              className="font-medium underline"
            >
              {t.rate.backToPlayer}
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
