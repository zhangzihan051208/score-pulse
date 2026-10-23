import {
  buildGlobalLeaderboard,
  defaultDimensionForSport,
  type RankingBoard,
} from "@/lib/rankings-server";
import { SPORTS, type Sport } from "@/lib/types";
import { NextResponse } from "next/server";

function parseSport(raw: string | null): Sport {
  if (raw && (SPORTS as readonly string[]).includes(raw)) return raw as Sport;
  return "nba";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const teamId = searchParams.get("teamId")?.trim() || undefined;
  const board = (searchParams.get("board") === "dimension"
    ? "dimension"
    : "overall") as RankingBoard;
  const dim =
    searchParams.get("dim")?.trim() ||
    (board === "dimension" ? defaultDimensionForSport(sport) : undefined);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  const entries = await buildGlobalLeaderboard({
    sport,
    board,
    dimId: dim,
    teamId,
    limit,
  });

  return NextResponse.json(
    { sport, board, dimId: dim, teamId, entries },
    {
      headers: {
        "Cache-Control": "private, max-age=25, stale-while-revalidate=90",
      },
    },
  );
}
