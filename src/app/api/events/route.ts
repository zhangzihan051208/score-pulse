import { pinBayernArsenal } from "@/lib/featured/bayern-arsenal";
import { listLiveMatchEvents, refreshLiveFixturesFromTsdb } from "@/lib/fixtures-sync";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { getDegradedMode } from "@/lib/service-degraded";
import { thesportsdbListEnrichMax } from "@/lib/upstream-budget";
import { maybeRefreshLiveFixturesFromTsdb } from "@/lib/sync-throttle";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const league = searchParams.get("league") ?? undefined;
  const forceSync = searchParams.get("sync") === "1";
  const degraded = getDegradedMode();

  if (!degraded.cacheOnly && forceSync) {
    await maybeRefreshLiveFixturesFromTsdb(refreshLiveFixturesFromTsdb, 4);
  }

  const sports =
    sport === "nba"
      ? (["nba"] as const)
      : sport === "soccer"
        ? (["soccer"] as const)
        : (["nba", "soccer"] as const);

  const limit = Number(searchParams.get("limit") ?? "12");
  const capped = Math.min(limit, 48);
  const wantLineups = searchParams.get("lineups") === "1";
  const readLive = () =>
    listLiveMatchEvents([...sports], capped, league, {
      enrichLineups: wantLineups && !degraded.cacheOnly,
      enrichMax: thesportsdbListEnrichMax(capped),
    });
  const loaded = forceSync
    ? await readLive()
    : await cachedLiveMatchEvents([...sports], capped, league);
  const events =
    !sport || sport === "soccer" ? pinBayernArsenal(loaded, league) : loaded;

  return NextResponse.json(
    {
      events,
      syncedAt: new Date().toISOString(),
      degraded,
    },
    {
      headers: {
        "Cache-Control": forceSync
          ? "private, no-store"
          : "public, s-maxage=8, stale-while-revalidate=20",
      },
    },
  );
}
