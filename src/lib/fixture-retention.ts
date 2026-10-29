import { mapTsdbStatus } from "@/lib/thesportsdb";
import type { EventStatus } from "@/lib/types";
import type { LiveFixtureRow } from "@/lib/live-match";

/** Boards that still use static seed events in `data.ts` (no live schedule API). */
export const SEED_ONLY_BOARD_SPORTS = ["nfl", "f1", "tennis", "ufc"] as const;

export type SeedOnlyBoardSport = (typeof SEED_ONLY_BOARD_SPORTS)[number];

const DAY_MS = 86_400_000;

/** Recent ended fixtures stay on boards (past results). */
export const ENDED_VISIBLE_DAYS = 14;

/** Keep ended rows in Supabase for ratings / deep links. */
export const ENDED_DB_RETAIN_DAYS = 45;

export function isSeedOnlyBoardSport(sport: string): sport is SeedOnlyBoardSport {
  return (SEED_ONLY_BOARD_SPORTS as readonly string[]).includes(sport);
}

export function fixtureRowStatus(row: Pick<LiveFixtureRow, "str_status">): EventStatus {
  return mapTsdbStatus(row.str_status ?? undefined);
}

function eventDayMs(date: string | null | undefined): number | null {
  if (!date) return null;
  return new Date(`${date}T12:00:00Z`).getTime();
}

/** Show on home/board lists: live, upcoming, and recently ended. */
export function isVisibleFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event">,
): boolean {
  const status = fixtureRowStatus(row);
  if (status === "live" || status === "upcoming") return true;
  if (status !== "ended") return false;
  const t = eventDayMs(row.date_event);
  if (t == null) return false;
  return Date.now() - t <= ENDED_VISIBLE_DAYS * DAY_MS;
}

/** Whether a synced TSDB row should be stored (sync + slug pages). */
export function shouldRetainFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event">,
): boolean {
  const status = fixtureRowStatus(row);
  if (status === "live" || status === "upcoming") return true;
  if (status !== "ended") return false;
  const t = eventDayMs(row.date_event);
  if (t == null) return false;
  return Date.now() - t <= ENDED_DB_RETAIN_DAYS * DAY_MS;
}

export function shouldPruneFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event">,
): boolean {
  return !shouldRetainFixtureRow(row);
}

export function isVisibleMatchStatus(status: EventStatus, startAt?: string): boolean {
  if (status === "live" || status === "upcoming") return true;
  if (status !== "ended" || !startAt) return false;
  const t = Date.parse(startAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= ENDED_VISIBLE_DAYS * DAY_MS;
}
