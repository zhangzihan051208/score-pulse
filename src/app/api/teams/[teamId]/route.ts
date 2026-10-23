import {
  findHonorTeam,
  playersOnClub,
  presentTeam,
} from "@/lib/reputation/catalog";
import { loadLiveHonorSamples } from "@/lib/reputation/live-samples";
import { buildTeamHub } from "@/lib/team-hub";
import type { TeamHub } from "@/lib/team-hub";
import type { ScoreMap } from "@/lib/types";
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

  const honor = findHonorTeam(sport, name || teamId);
  let teamSamples: ScoreMap[] = [];
  if (honor) {
    try {
      const extras = await loadLiveHonorSamples(sport);
      teamSamples = extras.byTeam.get(honor.id) ?? [];
    } catch {
      teamSamples = [];
    }
  }
  const hub = teamId.startsWith("honor-")
    ? null
    : await buildTeamHub(teamId, sport, name);
  if (!hub && honor) {
    const reputation = presentTeam(honor, teamSamples);
    const synthetic: TeamHub = {
      id: teamId,
      name: honor.name,
      sport,
      league: honor.league,
      description: honor.honors.en,
      roster: playersOnClub(honor.id).map((p) => ({
        id: p.id,
        name: p.name,
        position: p.positionKey,
      })),
      recent: [],
      upcoming: [],
      honors: [{ title: honor.honors.en }],
    };
    return NextResponse.json({ team: synthetic, reputation });
  }
  if (!hub) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const linked = honor ?? findHonorTeam(sport, hub.name);
  let linkedSamples = teamSamples;
  if (linked && linked.id !== honor?.id) {
    try {
      const extras = await loadLiveHonorSamples(sport);
      linkedSamples = extras.byTeam.get(linked.id) ?? [];
    } catch {
      linkedSamples = [];
    }
  }
  return NextResponse.json({
    team: hub,
    reputation: linked ? presentTeam(linked, linkedSamples) : null,
  });
}
