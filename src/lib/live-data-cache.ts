import { LIVE_SCORE_REFRESH_SEC } from "@/lib/fixtures-cadence";
import { unstable_cache } from "next/cache";
import { listLiveMatchEvents } from "@/lib/fixtures-sync";
import type { MatchEvent } from "@/lib/types";

/** Short TTL read path (虎扑式「微缓存」): fast DB reads, sync jobs update rows separately. */
export async function cachedLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit: number,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  const read = () => listLiveMatchEvents(sports, limit, leagueSlug);
  const events = await unstable_cache(
    read,
    [
      "live-match-events",
      sports.join(","),
      String(limit),
      leagueSlug ?? "all",
    ],
    { revalidate: LIVE_SCORE_REFRESH_SEC, tags: ["fixtures"] },
  )();
  if (events.length > 0) return events;
  return read();
}
