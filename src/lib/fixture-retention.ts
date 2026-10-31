import { mapTsdbStatus } from "@/lib/thesportsdb";
import type { EventStatus } from "@/lib/types";
import type { LiveFixtureRow } from "@/lib/live-match";

/** Boards that still use static seed events in `data.ts` (no live schedule API). */
export const SEED_ONLY_BOARD_SPORTS = ["nfl", "f1", "tennis", "ufc"] as const;

export type SeedOnlyBoardSport = (typeof SEED_ONLY_BOARD_SPORTS)[number];

const DAY_MS = 86_400_000;

/** Recent ended fixtures and their ratings stay visible. */
export const ENDED_VISIBLE_DAYS = 5;

/** Keep ended rows in Supabase for ratings / deep links (aligned with boards). */
export const ENDED_DB_RETAIN_DAYS = 5;

/** Upcoming fixtures shown on boards (kickoff within this window). */
export const UPCOMING_VISIBLE_DAYS = 5;

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

function isUpcomingInWindow(date: string | null | undefined, startAt?: string): boolean {
  const t =
    startAt != null && Number.isFinite(Date.parse(startAt))
      ? Date.parse(startAt)
      : eventDayMs(date);
  if (t == null) return true;
  const now = Date.now();
  return t >= now - DAY_MS && t <= now + UPCOMING_VISIBLE_DAYS * DAY_MS;
}

/** Show on home/board lists: live, upcoming (5d ahead), and recently ended (5d). */
export function isVisibleFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event">,
): boolean {
  const status = fixtureRowStatus(row);
  if (status === "live") return true;
  if (status === "upcoming") return isUpcomingInWindow(row.date_event);
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
  if (status === "live") return true;
  if (status === "upcoming") return isUpcomingInWindow(row.date_event);
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
  if (status === "live") return true;
  if (status === "upcoming") return isUpcomingInWindow(undefined, startAt);
  if (status !== "ended" || !startAt) return false;
  const t = Date.parse(startAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= ENDED_VISIBLE_DAYS * DAY_MS;
}
