import { honorBoard, type HonorBoardKind } from "@/lib/reputation/catalog";
import { loadLiveHonorSamples } from "@/lib/reputation/live-samples";
import { enrichHonorTeamBadges } from "@/lib/team-badges";
import { SPORTS, type ScoreMap, type Sport } from "@/lib/types";
import { NextResponse } from "next/server";

const CACHE_MS = 30_000;
const boardCache = new Map<string, { at: number; body: string }>();

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
  const cacheKey = `${kind}:${sport}`;
  const hit = boardCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return new NextResponse(hit.body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  }
  let extras: { byPlayer: Map<string, ScoreMap[]>; byTeam: Map<string, ScoreMap[]> } = {
    byPlayer: new Map(),
    byTeam: new Map(),
  };
  try {
    extras = await loadLiveHonorSamples(sport);
  } catch {
    extras = { byPlayer: new Map(), byTeam: new Map() };
  }
  let entries = honorBoard(
    kind,
    sport,
    kind === "teams" ? extras.byTeam : extras.byPlayer,
  );
  if (kind === "teams") {
    entries = await enrichHonorTeamBadges(entries);
  }
  const body = JSON.stringify({ kind, sport, entries });
  boardCache.set(cacheKey, { at: Date.now(), body });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
