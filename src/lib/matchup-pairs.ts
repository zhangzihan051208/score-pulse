import {
  athleteSide,
  isStartingPerformance,
  performancesBySide,
  type RosterEntry,
} from "@/lib/event-spotlight";
import type { CommunityState } from "@/lib/store";
import type { PositionKey } from "@/lib/position-ratings";
import type { Locale, MatchEvent } from "@/lib/types";

export type MatchupPair = {
  home: RosterEntry;
  away: RosterEntry;
  positionKey: PositionKey;
  /** 0-based slot when multiple players share the same position on both sides */
  slot: number;
};

function startersOnly(entries: RosterEntry[], locale: Locale): RosterEntry[] {
  return entries.filter(
    (entry) =>
      isStartingPerformance(entry.performance, locale) &&
      !entry.athlete.id.startsWith("curated-"),
  );
}

function groupByPosition(entries: RosterEntry[]): Map<PositionKey, RosterEntry[]> {
  const map = new Map<PositionKey, RosterEntry[]>();
  for (const entry of entries) {
    const key = entry.performance.positionKey;
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return map;
}

export function buildEventMatchups(
  event: MatchEvent,
  state: CommunityState,
  locale: Locale,
): MatchupPair[] {
  const { home, away } = performancesBySide(event, state, locale);
  const homeByPos = groupByPosition(startersOnly(home, locale));
  const awayByPos = groupByPosition(startersOnly(away, locale));
  const positionKeys = new Set<PositionKey>([
    ...homeByPos.keys(),
    ...awayByPos.keys(),
  ]);

  const pairs: MatchupPair[] = [];
  for (const positionKey of positionKeys) {
    const hList = homeByPos.get(positionKey) ?? [];
    const aList = awayByPos.get(positionKey) ?? [];
    const n = Math.min(hList.length, aList.length);
    for (let slot = 0; slot < n; slot++) {
      pairs.push({
        home: hList[slot]!,
        away: aList[slot]!,
        positionKey,
        slot,
      });
    }
  }

  return pairs.sort((a, b) => {
    const heatA = Math.max(a.home.performance.heat ?? 0, a.away.performance.heat ?? 0);
    const heatB = Math.max(b.home.performance.heat ?? 0, b.away.performance.heat ?? 0);
    if (heatA !== heatB) return heatB - heatA;
    if (a.positionKey !== b.positionKey) return a.positionKey.localeCompare(b.positionKey);
    return a.slot - b.slot;
  });
}

export function findMatchupForAthlete(
  event: MatchEvent,
  athleteId: string,
  state: CommunityState,
  locale: Locale,
): MatchupPair | null {
  for (const pair of buildEventMatchups(event, state, locale)) {
    if (
      pair.home.athlete.id === athleteId ||
      pair.away.athlete.id === athleteId
    ) {
      return pair;
    }
  }
  return null;
}

export function sideInMatchup(
  pair: MatchupPair,
  athleteId: string,
): "home" | "away" | null {
  if (pair.home.athlete.id === athleteId) return "home";
  if (pair.away.athlete.id === athleteId) return "away";
  return null;
}

export function opponentInMatchup(
  pair: MatchupPair,
  athleteId: string,
): RosterEntry | null {
  const side = sideInMatchup(pair, athleteId);
  if (side === "home") return pair.away;
  if (side === "away") return pair.home;
  return null;
}

/** Opposite side label for display when sides are ambiguous (seed data). */
export function rosterSideOfAthlete(
  event: MatchEvent,
  athlete: RosterEntry["athlete"],
): "home" | "away" | null {
  return athleteSide(event, athlete);
}
