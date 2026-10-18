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

  const postTake = useCallback(
    (
      eventId: string,
      athleteId: string,
      scores: ScoreMap,
      body?: string,
      nickname?: string,
    ) => {
      const current = getCommunitySnapshot();
      const author = (nickname ?? current.nickname).trim() || "Row 12";
      const rating: UserRating = {
        eventId,
        athleteId,
        scores,
        updatedAt: new Date().toISOString(),
      };
      const comments = body?.trim()
        ? ([
            {
              id: `local-${crypto.randomUUID()}`,
              eventId,
              athleteId,
              author,
              body: body.trim(),
              createdAt: new Date().toISOString(),
              scores,
              local: true as const,
            } satisfies UserComment,
            ...current.comments,
          ] as UserComment[])
        : current.comments;
      saveState({
        ...current,
        nickname: author,
        ratings: {
          ...current.ratings,
          [performanceKey(eventId, athleteId)]: rating,
        },
        comments,
      });
    },
    [],
  );

  return { state, postTake };
}
