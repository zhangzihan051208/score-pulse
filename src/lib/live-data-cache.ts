import { listLiveMatchEvents } from "@/lib/fixtures-sync";
import type { MatchEvent } from "@/lib/types";

/** Short TTL read path. Do not wrap this in unstable_cache: the list read must finish without waiting on upstream fetches. */
export function cachedLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit: number,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  return listLiveMatchEvents(sports, limit, leagueSlug);
}
