import { pinBayernArsenal } from "@/lib/featured/bayern-arsenal";
import {
  listLiveMatchEvents,
  refreshLiveFixturesFromTsdb,
  syncFixturesFast,
} from "@/lib/fixtures-sync";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { getDegradedMode } from "@/lib/service-degraded";
import { maybeRefreshLiveFixturesFromTsdb } from "@/lib/sync-throttle";
import { after, NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const league = searchParams.get("league") ?? undefined;
  const liveTick =
    searchParams.get("live") === "1" || searchParams.get("sync") === "1";
  const degraded = getDegradedMode();

  let liveRefreshed = false;
  if (!degraded.cacheOnly && liveTick) {
    liveRefreshed = await maybeRefreshLiveFixturesFromTsdb(
      refreshLiveFixturesFromTsdb,
      4,
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
  const loaded =
    liveTick || liveRefreshed
      ? await readLive()
      : await cachedLiveMatchEvents([...sports], capped, league);
  const events =
    !sport || sport === "soccer" ? pinBayernArsenal(loaded, league) : loaded;

  if (events.length === 0 && !degraded.cacheOnly) {
    after(() => {
      void syncFixturesFast(false).catch(() => undefined);
    });
  }

  return NextResponse.json(
    {
      events,
      syncedAt: new Date().toISOString(),
      degraded,
    },
    {
      headers: {
        "Cache-Control": liveTick
          ? "private, no-store"
          : "public, s-maxage=8, stale-while-revalidate=20",
      },
    },
  );
}
