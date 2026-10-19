import {
  listLiveMatchEvents,
  refreshLiveFixturesFromTsdb,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const league = searchParams.get("league") ?? undefined;
  const refresh = searchParams.get("refresh") === "1";

  const liveTick = searchParams.get("live") === "1";
  if (refresh || searchParams.get("sync") === "1") {
    await syncSportsDbFixtures(refresh);
  } else {
    await syncSportsDbFixtures(false);
    if (liveTick) {
      await refreshLiveFixturesFromTsdb(12);
    }
  }

  const sports =
    sport === "nba"
      ? (["nba"] as const)
      : sport === "soccer"
        ? (["soccer"] as const)
        : (["nba", "soccer"] as const);

  const limit = Number(searchParams.get("limit") ?? "12");
  const events = await listLiveMatchEvents(
    [...sports],
    Math.min(limit, 48),
    league,
  );

  return NextResponse.json({
    events,
    syncedAt: new Date().toISOString(),
  });
}
