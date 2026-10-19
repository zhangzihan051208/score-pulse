"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { mergeTakes } from "@/lib/community-takes";
import { useAuth } from "@/hooks/use-auth";
import { tx } from "@/lib/copy";
import {
  commentsFor,
  getUserRating,
  mergedAverages,
} from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  Athlete,
  Localized,
  MatchEvent,
  Performance,
  ScoreMap,
} from "@/lib/types";
import type { CommunityState } from "@/lib/store";
import type { Locale } from "@/lib/types";

export function usePlayerCommunity({
  event,
  athlete,
  performance,
  state,
  locale,
}: {
  event: MatchEvent;
  athlete: Athlete;
  performance: Performance;
  state: CommunityState;
  locale: Locale;
}) {
  const { user, enabled: authEnabled } = useAuth();
  const positionKey = performance.positionKey;
  const localMine = getUserRating(state, event.id, athlete.id);
  const merged = mergedAverages(event, athlete.id, state);
  const localComments = commentsFor(event.id, athlete.id, state);

  const [remoteTakes, setRemoteTakes] = useState<CommunityTake[]>([]);
  const [remoteMine, setRemoteMine] = useState<ScoreMap | null>(null);
  const [remoteCommunityAvg, setRemoteCommunityAvg] = useState<ScoreMap | null>(
    null,
  );
  const [mineComment, setMineComment] = useState("");

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
    setMineComment(data.mineComment ?? "");
    return data;
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
        positionKey,
      };
    }
    return merged;
  }, [
    cloudReads,
    merged,
    positionKey,
    remoteCommunityAvg,
    remoteMine,
    remoteTakes.length,
  ]);

  const cloudPost = isSupabaseConfigured();
  const mustSignIn = cloudPost && !user;

  return {
    positionKey,
    mine,
    displayMerged,
    panelTakes,
    mineComment,
    loadRemote,
    cloudPost,
    mustSignIn,
    user,
  };
}
