import { searchFixtures } from "@/lib/fixtures-sync";
import { hotWeightForTeam } from "@/lib/team-popularity";
import { intelligentTeamSearch } from "@/lib/team-search";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 40);
  const result = await searchFixtures(q, limit);

  const teamsRaw = await intelligentTeamSearch(q, { limit: 12 });
  const teams = teamsRaw.map((team) => ({
    ...team,
    hotWeight: hotWeightForTeam(team.name, team.sport),
  }));

  return NextResponse.json(
    { ...result, teams },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    },
  );
}
