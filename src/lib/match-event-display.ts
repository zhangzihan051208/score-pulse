import type { MatchEvent } from "@/lib/types";
import type { DegradedMode } from "@/lib/service-degraded";

export function applyDegradedToMatchEvent(
  event: MatchEvent,
  mode: Pick<DegradedMode, "hideLineups">,
): MatchEvent {
  if (!mode.hideLineups) return event;
  if (event.performances.length === 0) return event;
  return {
    ...event,
    performances: [],
    roster: {},
    summary: event.summary,
  };
}
