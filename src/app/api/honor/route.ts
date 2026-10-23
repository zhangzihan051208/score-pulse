import { honorBoard, type HonorBoardKind } from "@/lib/reputation/catalog";
import { loadLiveHonorSamples } from "@/lib/reputation/live-samples";
import { SPORTS, type ScoreMap, type Sport } from "@/lib/types";
import { NextResponse } from "next/server";

function parseKind(raw: string | null): HonorBoardKind {
  if (raw === "teams" || raw === "legends") return raw;
  return "players";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = parseKind(searchParams.get("kind"));
  const sportRaw = searchParams.get("sport");
  const sport =
    sportRaw && (SPORTS as readonly string[]).includes(sportRaw)
      ? (sportRaw as Sport)
      : "all";
  let extras: { byPlayer: Map<string, ScoreMap[]>; byTeam: Map<string, ScoreMap[]> } = {
    byPlayer: new Map(),
    byTeam: new Map(),
  };
  try {
    extras = await loadLiveHonorSamples(sport);
  } catch {
    extras = { byPlayer: new Map(), byTeam: new Map() };
  }
  const entries = honorBoard(
    kind,
    sport,
    kind === "teams" ? extras.byTeam : extras.byPlayer,
  );
  return NextResponse.json(
    { kind, sport, entries },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
