import { kickoffIsSoon } from "@/lib/match-clock";
import type { MatchEvent } from "@/lib/types";

/** Client poll intervals. Kickoff window and live games stay close to the wall clock. */
export const POLL = {
  detailLiveMs: 8_000,
  detailSoonMs: 10_000,
  detailIdleMs: 45_000,
  listLiveMs: 8_000,
  listSoonMs: 12_000,
  listIdleMs: 45_000,
  backgroundMs: 60_000,
  seedGraceMs: 4_000,
} as const;

function anyLiveOrSoon(events: MatchEvent[], now: number) {
  return events.some(
    (event) => event.status === "live" || kickoffIsSoon(event.startAt, now),
  );
}

export function listPollIntervalMs(
  events: MatchEvent[],
  tabVisible: boolean,
  now = Date.now(),
): number | null {
  if (events.length === 0) return POLL.listIdleMs;
  if (!tabVisible) return POLL.backgroundMs;
  const hasLive = events.some((e) => e.status === "live");
  if (hasLive) return POLL.listLiveMs;
  if (anyLiveOrSoon(events, now)) return POLL.listSoonMs;
  const allEnded = events.every((e) => e.status === "ended");
  if (allEnded) return POLL.listIdleMs;
  return POLL.listIdleMs;
}

export function detailPollIntervalMs(
  event: MatchEvent | null | undefined,
  tabVisible: boolean,
  now = Date.now(),
): number | null {
  if (!event || event.status === "ended") return null;
  if (!tabVisible) return POLL.backgroundMs;
  if (event.status === "live" || kickoffIsSoon(event.startAt, now)) return POLL.detailLiveMs;
  return POLL.detailIdleMs;
}
