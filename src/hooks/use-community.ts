"use client";

import { useCallback, useSyncExternalStore } from "react";
import { performanceKey } from "@/lib/data";
import {
  getCommunitySnapshot,
  getServerCommunitySnapshot,
  saveState,
  subscribeCommunity,
} from "@/lib/store";
import type { ScoreMap, UserComment, UserRating } from "@/lib/types";

export function useCommunity() {
  const state = useSyncExternalStore(
    subscribeCommunity,
    getCommunitySnapshot,
    getServerCommunitySnapshot,
  );

  const setNickname = useCallback((nickname: string) => {
    const current = getCommunitySnapshot();
    saveState({
      ...current,
      nickname: nickname.trim() || "看台席位 07",
    });
  }, []);

  const saveRating = useCallback(
    (eventId: string, athleteId: string, scores: ScoreMap) => {
      const current = getCommunitySnapshot();
      const rating: UserRating = {
        eventId,
        athleteId,
        scores,
        updatedAt: new Date().toISOString(),
      };
      saveState({
        ...current,
        ratings: {
          ...current.ratings,
          [performanceKey(eventId, athleteId)]: rating,
        },
      });
    },
    [],
  );

  const addComment = useCallback(
    (
      eventId: string,
      athleteId: string,
      body: string,
      scores?: Partial<ScoreMap>,
    ) => {
      const current = getCommunitySnapshot();
      const comment: UserComment = {
        id: `local-${crypto.randomUUID()}`,
        eventId,
        athleteId,
        author: current.nickname,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        scores,
        local: true,
      };
      saveState({ ...current, comments: [comment, ...current.comments] });
    },
    [],
  );

  return { state, ready: true, setNickname, saveRating, addComment };
}
