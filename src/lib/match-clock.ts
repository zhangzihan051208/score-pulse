import type { EventStatus, MatchEvent, Sport } from "@/lib/types";

/** Expected length before we stop treating a stale "not started" row as live. */
const EXPECTED_MS: Partial<Record<Sport, number>> = {
  soccer: 115 * 60_000,
  nba: 160 * 60_000,
  esports: 180 * 60_000,
  nfl: 210 * 60_000,
  tennis: 180 * 60_000,
  ufc: 40 * 60_000,
  f1: 120 * 60_000,
};

const OT_GRACE_MS = 25 * 60_000;

export function expectedMatchMs(sport: Sport): number {
  return EXPECTED_MS[sport] ?? 150 * 60_000;
}

type ClockEvent = Pick<MatchEvent, "startAt" | "status" | "sport">;

/** Move upcoming/live to match the wall clock when the feed status lags kickoff. */
export function alignEventToNow<T extends ClockEvent>(event: T, now = Date.now()): T {
  const start = Date.parse(event.startAt);
  if (!Number.isFinite(start)) return event;
  if (event.status === "ended" || event.status === "live") return event;

  const dur = expectedMatchMs(event.sport);
  const endWindow = start + dur + OT_GRACE_MS;

  let status: EventStatus;
  if (now < start) status = "upcoming";
  else if (now > endWindow) status = "ended";
  else status = "live";

  if (status === event.status) return event;
  return { ...event, status };
}

export function alignEventsToNow<T extends ClockEvent>(events: T[], now = Date.now()): T[] {
  let changed = false;
  const next = events.map((event) => {
    const aligned = alignEventToNow(event, now);
    if (aligned !== event) changed = true;
    return aligned;
  });
  return changed ? next : events;
}

/** Minutes since kickoff, for a live clock when the feed has no period string. */
export function elapsedMatchMinutes(startAt: string, now = Date.now()): number | null {
  const start = Date.parse(startAt);
  if (!Number.isFinite(start) || now < start) return null;
  return Math.floor((now - start) / 60_000);
}

export function kickoffIsSoon(startAt: string, now = Date.now(), withinMs = 15 * 60_000): boolean {
  const start = Date.parse(startAt);
  if (!Number.isFinite(start)) return false;
  return start - now <= withinMs && now - start <= expectedMatchMs("soccer") + OT_GRACE_MS;
}
