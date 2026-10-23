import { unstable_cache } from "next/cache";
import { listLiveMatchEvents } from "@/lib/fixtures-sync";
import type { MatchEvent } from "@/lib/types";

/** Short TTL read path (虎扑式「微缓存」): fast DB reads, sync jobs update rows separately. */
export function cachedLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit: number,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  return unstable_cache(
    () => listLiveMatchEvents(sports, limit, leagueSlug),
    [
      "live-match-events",
      sports.join(","),
      String(limit),
      leagueSlug ?? "all",
    ],
    { revalidate: 8, tags: ["fixtures"] },
  )();
}
