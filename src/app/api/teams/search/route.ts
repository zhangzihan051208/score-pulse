import { searchTeamsInFixtures } from "@/lib/fixtures-sync";
import { getLeagueBySlug } from "@/lib/leagues";
import { searchTeamsByName } from "@/lib/thesportsdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const sport = searchParams.get("sport") as "nba" | "soccer" | null;
  const leagueSlug = searchParams.get("league") ?? undefined;
  const leagueId = leagueSlug ? getLeagueBySlug(leagueSlug)?.tsdbId : undefined;

  const local = await searchTeamsInFixtures(
    q,
    sport ?? undefined,
    leagueId,
    10,
  );

  if (local.length >= 5) {
    return NextResponse.json({ teams: local });
  }

  const remote = await searchTeamsByName(q);
  const merged = new Map(local.map((t) => [t.id, t]));

  for (const t of remote) {
    if (!t.idTeam || !t.strTeam || merged.has(t.idTeam)) continue;
    const league = t.strLeague ?? "";
    const inferredSport: "nba" | "soccer" =
      league.includes("NBA") || league.includes("Basketball") ? "nba" : "soccer";
    if (sport && inferredSport !== sport) continue;
    merged.set(t.idTeam, {
      id: t.idTeam,
      name: t.strTeam,
      league: t.strLeague,
      sport: inferredSport,
    });
    if (merged.size >= 12) break;
  }

  return NextResponse.json({ teams: [...merged.values()] });
}
