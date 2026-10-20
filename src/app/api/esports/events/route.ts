import { isEsportsGameSlug } from "@/lib/esports-games";
import { esportsDataSource, listEsportsMatchEvents } from "@/lib/esports-catalog";
import { cachedEsportsMatchEvents } from "@/lib/esports-data-cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "32"), 48);
  const liveTick = searchParams.get("live") === "1";

  const gameSlug =
    game && isEsportsGameSlug(game) ? game : undefined;

  const events = liveTick
    ? await listEsportsMatchEvents(gameSlug, limit)
    : await cachedEsportsMatchEvents(gameSlug, limit);

  return NextResponse.json(
    {
      events,
      source: esportsDataSource(),
      syncedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
      },
    },
  );
}
