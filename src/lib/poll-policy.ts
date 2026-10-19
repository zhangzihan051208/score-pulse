import type { MatchEvent } from "@/lib/types";

/** Client poll intervals — tiered like Hupu/FlashScore (push when available, adaptive poll otherwise). */
export const POLL = {
  /** Match detail while live and tab visible */
  detailLiveMs: 15_000,
  /** Match detail upcoming */
  detailUpcomingMs: 60_000,
  /** List with at least one live fixture */
  listLiveMs: 25_000,
  /** List no live games */
  listIdleMs: 60_000,
  /** Tab in background — minimal traffic */
  backgroundMs: 120_000,
  /** Skip client refresh when SSR seed is this fresh */
  seedGraceMs: 20_000,
} as const;

export function listPollIntervalMs(events: MatchEvent[], tabVisible: boolean): number | null {
  const hasLive = events.some((e) => e.status === "live");
  if (!hasLive) return null;
  if (!tabVisible) return POLL.backgroundMs;
  return POLL.listLiveMs;
}

export function detailPollIntervalMs(
  event: MatchEvent | null | undefined,
  tabVisible: boolean,
): number | null {
  if (!event) return null;
  if (!tabVisible) return POLL.backgroundMs;
  if (event.status === "live") return POLL.detailLiveMs;
  return null;
}
