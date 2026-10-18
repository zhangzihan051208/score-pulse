import { listFixturesForTeam } from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId") ?? "";
  const teamName = searchParams.get("teamName") ?? undefined;
  const sport = searchParams.get("sport") as "nba" | "soccer" | null;

  if (!teamId || !sport) {
    return NextResponse.json({ error: "teamId and sport required" }, { status: 400 });
  }

  const events = await listFixturesForTeam(
    teamId,
    sport,
    teamName,
    Math.min(Number(searchParams.get("limit") ?? "40"), 60),
  );

  return NextResponse.json({ events });
}
