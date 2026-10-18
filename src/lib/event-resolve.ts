import { athletes } from "./data";
import type { Athlete, MatchEvent } from "./types";

export function resolveAthlete(
  event: MatchEvent,
  athleteId: string,
): Athlete | undefined {
  if (event.roster?.[athleteId]) return event.roster[athleteId];
  return athletes[athleteId];
}
