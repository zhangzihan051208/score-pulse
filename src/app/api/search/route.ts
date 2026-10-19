import {
  searchFixtures,
  searchTeamsInFixtures,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
import { searchTeamsByName } from "@/lib/thesportsdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const sync = searchParams.get("sync") === "1";

  if (sync) {
    await syncSportsDbFixtures(false);
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 40);
  const result = await searchFixtures(q, limit);

  let teams = await searchTeamsInFixtures(q, undefined, undefined, 10);
  if (teams.length < 6) {
    const remote = await searchTeamsByName(q);
    const seen = new Set(teams.map((t) => t.id));
    for (const t of remote) {
      if (!t.idTeam || !t.strTeam || seen.has(t.idTeam)) continue;
      const league = t.strLeague ?? "";
      const sport: "nba" | "soccer" =
        league.includes("NBA") || league.includes("Basketball") ? "nba" : "soccer";
      teams.push({
        id: t.idTeam,
        name: t.strTeam,
        league: t.strLeague,
        sport,
      });
      seen.add(t.idTeam);
      if (teams.length >= 12) break;
    }
  }

  return NextResponse.json({ ...result, teams });
}
