import type { MatchEvent } from "@/lib/types";

/** Players to show on a board. Uses the stored count when this payload has no names. */
export function listedRosterCount(event: Pick<MatchEvent, "performances" | "playerCount">) {
  if (event.performances.length > 0) return event.performances.length;
  return event.playerCount ?? 0;
}
