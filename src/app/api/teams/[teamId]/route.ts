import { buildTeamHub } from "@/lib/team-hub";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await context.params;
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") as "nba" | "soccer" | null;
  const name = searchParams.get("name") ?? undefined;

  if (!sport || (sport !== "nba" && sport !== "soccer")) {
    return NextResponse.json({ error: "sport required (nba|soccer)" }, { status: 400 });
  }

  const hub = await buildTeamHub(teamId, sport, name);
  if (!hub) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ team: hub });
}
