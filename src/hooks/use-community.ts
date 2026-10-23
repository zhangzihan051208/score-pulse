"use client";

import { useCallback, useSyncExternalStore } from "react";
import { performanceKey } from "@/lib/score-display";
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
      const key = performanceKey(eventId, athleteId);
      const rating: UserRating = {
        eventId,
        athleteId,
        scores,
        updatedAt: new Date().toISOString(),
      };

      const trimmed = body?.trim() ?? "";
      const withoutThisTake = current.comments.filter(
        (c) =>
          !(
            c.eventId === eventId &&
            c.athleteId === athleteId &&
            c.local &&
            c.author === author
          ),
      );

      const comments =
        trimmed.length >= 8
          ? ([
              {
                id: `local-${key}`,
                eventId,
                athleteId,
                author,
                body: trimmed,
                createdAt: new Date().toISOString(),
                scores,
                local: true as const,
              } satisfies UserComment,
              ...withoutThisTake,
            ] as UserComment[])
          : withoutThisTake;

      saveState({
        ...current,
        nickname: author,
        ratings: {
          ...current.ratings,
          [key]: rating,
        },
        comments,
      });
    },
    [],
  );

  return { state, postTake };
}
