import { isEsportsGameSlug } from "@/lib/esports-games";
import { esportsDataSource } from "@/lib/esports-catalog";
import { cachedEsportsMatchEvents } from "@/lib/esports-data-cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "32"), 48);

  const gameSlug =
    game && isEsportsGameSlug(game) ? game : undefined;

  const events = await cachedEsportsMatchEvents(gameSlug, limit);
  const source = esportsDataSource();

  return NextResponse.json(
    {
      events,
      source,
      syncedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240",
      },
    },
  );
}
