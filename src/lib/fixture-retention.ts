import { mapTsdbStatus } from "@/lib/thesportsdb";
import type { EventStatus } from "@/lib/types";
import type { LiveFixtureRow } from "@/lib/live-match";

/** Boards that still use static seed events in `data.ts` (no live schedule API). */
export const SEED_ONLY_BOARD_SPORTS = ["nfl", "f1", "tennis", "ufc"] as const;

export type SeedOnlyBoardSport = (typeof SEED_ONLY_BOARD_SPORTS)[number];

export function isSeedOnlyBoardSport(sport: string): sport is SeedOnlyBoardSport {
  return (SEED_ONLY_BOARD_SPORTS as readonly string[]).includes(sport);
}

export function fixtureRowStatus(row: Pick<LiveFixtureRow, "str_status">): EventStatus {
  return mapTsdbStatus(row.str_status ?? undefined);
}

/** Live and upcoming fixtures only — ended / full-time rows are treated as expired. */
export function isActiveFixtureRow(row: Pick<LiveFixtureRow, "str_status">): boolean {
  const status = fixtureRowStatus(row);
  return status === "live" || status === "upcoming";
}

export function isActiveMatchStatus(status: EventStatus): boolean {
  return status === "live" || status === "upcoming";
}

/** Whether a synced TSDB row should be stored or shown in lists. */
export function shouldRetainFixtureRow(row: Pick<LiveFixtureRow, "str_status">): boolean {
  return isActiveFixtureRow(row);
}
