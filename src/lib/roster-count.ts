import type { MatchEvent } from "@/lib/types";

/** Players to show on a board. Uses the stored count when this payload has no names. */
export function listedRosterCount(event: Pick<MatchEvent, "performances" | "playerCount">) {
  return Math.max(event.performances.length, event.playerCount ?? 0);
}
