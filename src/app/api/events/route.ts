import {
  listLiveMatchEvents,
  refreshLiveFixturesFromTsdb,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { getDegradedMode } from "@/lib/service-degraded";
import { maybeRefreshLiveFixturesFromTsdb } from "@/lib/sync-throttle";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const league = searchParams.get("league") ?? undefined;
  const refresh = searchParams.get("refresh") === "1";
  const sync = searchParams.get("sync") === "1";
  const liveTick = searchParams.get("live") === "1";
  const degraded = getDegradedMode();

  let liveRefreshed = false;
  if (!degraded.cacheOnly) {
    if (sync || refresh) {
      await syncSportsDbFixtures(refresh || sync);
    } else if (liveTick) {
      liveRefreshed = await maybeRefreshLiveFixturesFromTsdb(
        refreshLiveFixturesFromTsdb,
        8,
      );
    }
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
  const events =
    sync || refresh || liveRefreshed
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
