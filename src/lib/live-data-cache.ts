import { LIVE_SCORE_REFRESH_SEC } from "@/lib/fixtures-cadence";
import { unstable_cache } from "next/cache";
import { listLiveMatchEvents } from "@/lib/fixtures-sync";
import { withUpstreamTimeout } from "@/lib/service-degraded";
import type { MatchEvent } from "@/lib/types";

/** The page shell must replace the loading view even when the database never answers. */
const PAGE_READ_MS = 8_000;

/** Short TTL read path (虎扑式「微缓存」): fast DB reads, sync jobs update rows separately. */
export async function cachedLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit: number,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  const read = () => listLiveMatchEvents(sports, limit, leagueSlug);
  const load = () =>
    unstable_cache(
      read,
      [
        "live-match-events-v3",
        sports.join(","),
        String(limit),
        leagueSlug ?? "all",
      ],
      { revalidate: LIVE_SCORE_REFRESH_SEC, tags: ["fixtures"] },
    )();
  try {
    const events = await withUpstreamTimeout(load(), PAGE_READ_MS, () => {});
    if (events.length > 0) return events;
  } catch {
    /* cached read stalled */
  }
  try {
    return await withUpstreamTimeout(read(), PAGE_READ_MS, () => {});
  } catch {
    return [];
  }
}
