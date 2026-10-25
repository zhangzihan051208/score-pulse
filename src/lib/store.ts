"use client";

import { performanceKey } from "./score-display";
import { seedComments } from "./seed-comments";
import {
  dimensionIds,
  emptyScoresForPosition,
  weightedOverall,
} from "./position-ratings";
import type { PositionKey } from "./position-ratings";
import type { MatchTake } from "./match-takes";
import type {
  MatchEvent,
  ScoreMap,
  SeedComment,
  Sport,
  UserComment,
  UserRating,
} from "./types";

const STORAGE_KEY = "sideline-community-v3";

export type CommunityState = {
  nickname: string;
  ratings: Record<string, UserRating>;
  comments: UserComment[];
  /** One local score for the match itself, keyed by event id. */
  matchTakes: Record<string, MatchTake>;
};

export const defaultState: CommunityState = {
  nickname: "Row 12",
  ratings: {},
  comments: [],
  matchTakes: {},
};

const listeners = new Set<() => void>();
let snapshot: CommunityState = defaultState;
let snapshotRaw: string | null = null;
let hydrated = false;

export function emptyScores(_sport: Sport, positionKey: PositionKey): ScoreMap {
  return emptyScoresForPosition(positionKey);
}

function parseState(raw: string | null): CommunityState {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw) as CommunityState;
    return {
      nickname: parsed.nickname || defaultState.nickname,
      ratings: parsed.ratings || {},
      comments: parsed.comments || [],
      matchTakes:
        parsed.matchTakes && typeof parsed.matchTakes === "object" ? parsed.matchTakes : {},
    };
  } catch {
    return defaultState;
  }
}

function readFromStorage(): CommunityState {
  if (typeof window === "undefined") return defaultState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === snapshotRaw && hydrated) return snapshot;
  snapshotRaw = raw;
  snapshot = parseState(raw);
  hydrated = true;
  return snapshot;
}

export function subscribeCommunity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCommunitySnapshot() {
  return readFromStorage();
}

export function getServerCommunitySnapshot() {
  return defaultState;
}

export function saveState(state: CommunityState) {
  const raw = JSON.stringify(state);
  window.localStorage.setItem(STORAGE_KEY, raw);
  snapshot = state;
  snapshotRaw = raw;
  hydrated = true;
  listeners.forEach((listener) => listener());
}

export function getUserRating(
  state: CommunityState,
  eventId: string,
  athleteId: string,
) {
  return state.ratings[performanceKey(eventId, athleteId)];
}

export function mergedAverages(
  event: MatchEvent,
  athleteId: string,
  state: CommunityState,
) {
  const performance = event.performances.find((p) => p.athleteId === athleteId);
  if (!performance) return null;
  const dims = dimensionIds(performance.positionKey);
  const mine = getUserRating(state, event.id, athleteId);
  if (!mine) {
    return {
      avg: performance.communityAvg,
      count: performance.ratingCount,
      mine: null as ScoreMap | null,
      positionKey: performance.positionKey,
    };
  }
  const count = performance.ratingCount + 1;
  const avg: ScoreMap = {};
  for (const id of dims) {
    const seed = performance.communityAvg[id] ?? 0;
    const you = mine.scores[id] ?? seed;
    avg[id] = Number(((seed * performance.ratingCount + you) / count).toFixed(1));
  }
  return {
    avg,
    count,
    mine: mine.scores,
    positionKey: performance.positionKey,
  };
}

export function commentsFor(
  eventId: string,
  athleteId: string,
  state: CommunityState,
): Array<SeedComment | UserComment> {
  return [...seedComments, ...state.comments]
    .filter((c) => c.eventId === eventId && c.athleteId === athleteId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function allFeedItems(state: CommunityState) {
  type FeedItem = {
    kind: "take";
    at: string;
    eventId: string;
    athleteId: string;
    author: string;
    scores: ScoreMap;
    body?: string;
  };

  const byKey = new Map<string, FeedItem>();

  for (const c of [...seedComments, ...state.comments]) {
    const key = `${c.eventId}:${c.athleteId}:${c.author}`;
    const existing = byKey.get(key);
    const at = c.createdAt;
    const bodyText = "local" in c && c.local ? c.body : undefined;
    byKey.set(key, {
      kind: "take",
      at: existing && +new Date(existing.at) > +new Date(at) ? existing.at : at,
      eventId: c.eventId,
      athleteId: c.athleteId,
      author: c.author,
      scores: c.scores ?? existing?.scores ?? {},
      body: bodyText ?? existing?.body,
    });
  }

  for (const r of Object.values(state.ratings)) {
    const key = `${r.eventId}:${r.athleteId}:${state.nickname}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.scores = r.scores;
      if (+new Date(r.updatedAt) > +new Date(existing.at)) {
        existing.at = r.updatedAt;
      }
    } else {
      byKey.set(key, {
        kind: "take",
        at: r.updatedAt,
        eventId: r.eventId,
        athleteId: r.athleteId,
        author: state.nickname,
        scores: r.scores,
      });
    }
  }

  return [...byKey.values()].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export function clampScore(n: number) {
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

export { weightedOverall as overallFromScores };
