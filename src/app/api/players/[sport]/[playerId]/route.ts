import {
  buildPlayerEventRankings,
} from "@/lib/rankings-server";
import { SPORTS, type Sport } from "@/lib/types";
import { NextResponse } from "next/server";

function parseSport(raw: string): Sport | null {
  return (SPORTS as readonly string[]).includes(raw) ? (raw as Sport) : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ sport: string; playerId: string }> },
) {
  const { sport: sportRaw, playerId } = await context.params;
  const sport = parseSport(sportRaw);
  if (!sport) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const data = await buildPlayerEventRankings(sport, decodeURIComponent(playerId));

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
    },
  });
}
