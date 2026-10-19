import { listLiveMatchEvents, refreshLiveFixturesFromTsdb } from "@/lib/fixtures-sync";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { getDegradedMode } from "@/lib/service-degraded";
import { maybeRefreshLiveFixturesFromTsdb } from "@/lib/sync-throttle";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const league = searchParams.get("league") ?? undefined;
  const liveTick = searchParams.get("live") === "1";
  const degraded = getDegradedMode();

  let liveRefreshed = false;
  if (!degraded.cacheOnly && liveTick) {
    liveRefreshed = await maybeRefreshLiveFixturesFromTsdb(
      refreshLiveFixturesFromTsdb,
      8,
    );
  }

  const sports =
    sport === "nba"
      ? (["nba"] as const)
      : sport === "soccer"
        ? (["soccer"] as const)
        : (["nba", "soccer"] as const);

  const limit = Number(searchParams.get("limit") ?? "12");
  const capped = Math.min(limit, 48);
  const readLive = () => listLiveMatchEvents([...sports], capped, league);
  const events = liveRefreshed
    ? await readLive()
    : await cachedLiveMatchEvents([...sports], capped, league);

  return NextResponse.json(
    {
      events,
      syncedAt: new Date().toISOString(),
      degraded,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
      },
    },
  );
}
