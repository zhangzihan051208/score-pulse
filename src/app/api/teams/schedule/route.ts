import {
  listFixturesForTeam,
  listUpcomingFixturesForTeam,
} from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId") ?? "";
  const teamName = searchParams.get("teamName")?.trim() || undefined;
  const sport = searchParams.get("sport") as "nba" | "soccer" | null;
  const upcoming = searchParams.get("upcoming") === "1";

  if (!sport || (sport !== "nba" && sport !== "soccer")) {
    return NextResponse.json({ error: "sport must be nba or soccer" }, { status: 400 });
  }
  if (!teamId && !teamName) {
    return NextResponse.json({ error: "teamId or teamName required" }, { status: 400 });
  }

  const id = teamId || teamName!;
  const cap = Math.min(
    Number(searchParams.get("limit") ?? (upcoming ? "20" : "40")),
    60,
  );
  const events = upcoming
    ? await listUpcomingFixturesForTeam(id, sport, teamName, cap)
    : await listFixturesForTeam(id, sport, teamName, cap);

  return NextResponse.json(
    { events },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
