"use client";

import { DIMENSIONS, performanceKey, seedComments } from "./data";
import type {
  DimensionId,
  MatchEvent,
  ScoreMap,
  SeedComment,
  UserComment,
  UserRating,
} from "./types";

const STORAGE_KEY = "saiping-community-v1";

export type CommunityState = {
  nickname: string;
  ratings: Record<string, UserRating>;
  comments: UserComment[];
};

export const defaultState: CommunityState = {
  nickname: "看台席位 07",
  ratings: {},
  comments: [],
};

const listeners = new Set<() => void>();
let snapshot: CommunityState = defaultState;
let snapshotRaw: string | null = null;
let hydrated = false;

function emptyScores(): ScoreMap {
  return {
    technique: 7,
    tactics: 7,
    fitness: 7,
    mentality: 7,
    overall: 7,
  };
}

function parseState(raw: string | null): CommunityState {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw) as CommunityState;
    return {
      nickname: parsed.nickname || defaultState.nickname,
      ratings: parsed.ratings || {},
      comments: parsed.comments || [],
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

function emit() {
  listeners.forEach((listener) => listener());
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
  emit();
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
  const mine = getUserRating(state, event.id, athleteId);
  if (!mine) {
    return {
      avg: performance.communityAvg,
      count: performance.ratingCount,
      mine: null as ScoreMap | null,
    };
  }
  const count = performance.ratingCount + 1;
  const avg = Object.fromEntries(
    DIMENSIONS.map((d) => {
      const seedTotal = performance.communityAvg[d.id] * performance.ratingCount;
      return [d.id, Number(((seedTotal + mine.scores[d.id]) / count).toFixed(1))];
    }),
  ) as ScoreMap;
  return { avg, count, mine: mine.scores };
}

export function commentsFor(
  eventId: string,
  athleteId: string,
  state: CommunityState,
): SeedComment[] {
  return [...seedComments, ...state.comments]
    .filter((c) => c.eventId === eventId && c.athleteId === athleteId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function allFeedItems(state: CommunityState) {
  const comments = [...seedComments, ...state.comments].map((c) => ({
    kind: "comment" as const,
    at: c.createdAt,
    ...c,
  }));
  const ratings = Object.values(state.ratings).map((r) => ({
    kind: "rating" as const,
    at: r.updatedAt,
    eventId: r.eventId,
    athleteId: r.athleteId,
    author: state.nickname,
    scores: r.scores,
  }));
  return [...comments, ...ratings].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export { emptyScores };

export function clampScore(n: number) {
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

export function overallFromRest(scores: ScoreMap): number {
  const rest: DimensionId[] = ["technique", "tactics", "fitness", "mentality"];
  const avg = rest.reduce((sum, id) => sum + scores[id], 0) / rest.length;
  return clampScore(avg);
}
