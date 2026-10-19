import { getLeagueBySlug } from "@/lib/leagues";
import { hotWeightForTeam } from "@/lib/team-popularity";
import { intelligentTeamSearch } from "@/lib/team-search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const sport = searchParams.get("sport") as "nba" | "soccer" | null;
  const leagueSlug = searchParams.get("league") ?? undefined;
  const leagueId = leagueSlug ? getLeagueBySlug(leagueSlug)?.tsdbId : undefined;

  const teamsRaw = await intelligentTeamSearch(q, {
    limit: 12,
    sport: sport ?? undefined,
    leagueId,
  });

  const teams = teamsRaw.map((team) => ({
    ...team,
    hotWeight: hotWeightForTeam(team.name, team.sport),
  }));

  return NextResponse.json({ teams });
}
