import {
  getLiveMatchBySlug,
  refreshFixtureFromTsdb,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
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
  } else if (liveRefresh) {
    await syncSportsDbFixtures(false);
  } else {
    await syncSportsDbFixtures(false);
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
    const refreshed = await refreshFixtureFromTsdb(event.id);
    if (refreshed) event = refreshed;
  }

  return NextResponse.json({ event, syncedAt: new Date().toISOString() });
}
