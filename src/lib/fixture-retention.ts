import { alignEventToNow } from "@/lib/match-clock";
import { mapTsdbStatus } from "@/lib/thesportsdb";
import type { EventStatus, Sport } from "@/lib/types";
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

export function fixtureKickoffIso(
  row: Pick<LiveFixtureRow, "date_event" | "str_time">,
): string | null {
  if (!row.date_event) return null;
  const t = row.str_time?.slice(0, 8) ?? "12:00:00";
  return `${row.date_event}T${t}Z`;
}

export function fixtureKickoffMs(
  row: Pick<LiveFixtureRow, "date_event" | "str_time">,
): number | null {
  const iso = fixtureKickoffIso(row);
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : eventDayMs(row.date_event);
}

/** Wall-clock status when TSDB `str_status` lags kickoff or final whistle. */
export function effectiveFixtureStatus(
  row: Pick<LiveFixtureRow, "str_status" | "date_event" | "str_time" | "sport">,
  now = Date.now(),
): EventStatus {
  const mapped = fixtureRowStatus(row);
  const startAt = fixtureKickoffIso(row) ?? "";
  const sport: Sport = row.sport === "nba" ? "nba" : "soccer";
  if (!startAt) return mapped;
  return alignEventToNow({ startAt, status: mapped, sport }, now).status;
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

function endedWithinDays(
  row: Pick<LiveFixtureRow, "date_event" | "str_time">,
  days: number,
  now = Date.now(),
): boolean {
  const kick = fixtureKickoffMs(row);
  if (kick == null) return false;
  return now - kick <= days * DAY_MS;
}

/** Show on home/board lists: live, upcoming (5d ahead), and recently ended (5d). */
export function isVisibleFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event" | "str_time" | "sport">,
): boolean {
  const status = effectiveFixtureStatus(row);
  if (status === "live") return true;
  if (status === "upcoming") {
    return isUpcomingInWindow(row.date_event, fixtureKickoffIso(row) ?? undefined);
  }
  if (status !== "ended") return false;
  return endedWithinDays(row, ENDED_VISIBLE_DAYS);
}

/** Whether a synced TSDB row should be stored (sync + slug pages). */
export function shouldRetainFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event" | "str_time" | "sport">,
): boolean {
  const status = effectiveFixtureStatus(row);
  if (status === "live") return true;
  if (status === "upcoming") {
    return isUpcomingInWindow(row.date_event, fixtureKickoffIso(row) ?? undefined);
  }
  if (status !== "ended") return false;
  return endedWithinDays(row, ENDED_DB_RETAIN_DAYS);
}

export function shouldPruneFixtureRow(
  row: Pick<LiveFixtureRow, "str_status" | "date_event" | "str_time" | "sport">,
): boolean {
  return !shouldRetainFixtureRow(row);
}

/** Keep ended fixtures on boards even when live/upcoming rows dominate the cap. */
export function balanceFixturesByStatus<T extends LiveFixtureRow>(
  rows: T[],
  limit: number,
): T[] {
  if (rows.length <= limit) return rows;
  const by: Record<EventStatus, T[]> = { live: [], upcoming: [], ended: [] };
  for (const row of rows) {
    by[effectiveFixtureStatus(row)].push(row);
  }
  const asc = (a: T, b: T) => (a.date_event ?? "").localeCompare(b.date_event ?? "");
  const desc = (a: T, b: T) => (b.date_event ?? "").localeCompare(a.date_event ?? "");
  by.live.sort(asc);
  by.upcoming.sort(asc);
  by.ended.sort(desc);

  const endedCap = Math.min(
    by.ended.length,
    Math.max(12, Math.ceil(limit * 0.4)),
  );
  const liveCap = Math.min(by.live.length, Math.max(6, Math.ceil(limit * 0.25)));
  const upcomingCap = Math.min(
    by.upcoming.length,
    Math.max(6, limit - endedCap - liveCap),
  );

  const picked = new Set<string>();
  const out: T[] = [];
  const take = (pool: T[], n: number) => {
    for (const row of pool) {
      if (out.length >= limit || n <= 0) break;
      if (picked.has(row.id_event)) continue;
      picked.add(row.id_event);
      out.push(row);
      n -= 1;
    }
  };
  take(by.live, liveCap);
  take(by.ended, endedCap);
  take(by.upcoming, upcomingCap);
  for (const pool of [by.live, by.ended, by.upcoming]) {
    take(pool, limit - out.length);
  }
  return out;
}

export function isVisibleMatchStatus(status: EventStatus, startAt?: string): boolean {
  if (status === "live") return true;
  if (status === "upcoming") return isUpcomingInWindow(undefined, startAt);
  if (status !== "ended" || !startAt) return false;
  const t = Date.parse(startAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= ENDED_VISIBLE_DAYS * DAY_MS;
}
