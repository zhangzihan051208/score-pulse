import {
  getLiveMatchBySlug,
  refreshFixtureFromTsdb,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
import { maybeRefreshFixtureFromTsdb } from "@/lib/sync-throttle";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const liveRefresh = searchParams.get("live") === "1";
  if (searchParams.get("sync") === "1") {
    await syncSportsDbFixtures(true);
  }

  let event = await getLiveMatchBySlug(slug);
  if (!event && /^\d+$/.test(slug)) {
    const { getLiveMatchById } = await import("@/lib/fixtures-sync");
    event = await getLiveMatchById(slug);
  }
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (liveRefresh) {
    const refreshed = await maybeRefreshFixtureFromTsdb(event.id, refreshFixtureFromTsdb);
    if (refreshed) event = refreshed;
  }

  return NextResponse.json(
    { event, syncedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=12, stale-while-revalidate=30",
      },
    },
  );
}
