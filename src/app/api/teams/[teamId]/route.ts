import {
  findHonorTeam,
  playersOnClub,
  presentTeam,
} from "@/lib/reputation/catalog";
import { teamTimeline } from "@/lib/reputation/dossier";
import { portraitFor } from "@/lib/reputation/portraits";
import { loadLiveHonorSamples } from "@/lib/reputation/live-samples";
import { buildTeamHub } from "@/lib/team-hub";
import { resolveTeamBadgeUrl } from "@/lib/team-badges";
import type { TeamEventCard, TeamHub } from "@/lib/team-hub";
import { SPORTS, type ScoreMap, type Sport } from "@/lib/types";
import { NextResponse } from "next/server";

function asSport(value: string | null): Sport | null {
  return value && (SPORTS as readonly string[]).includes(value) ? (value as Sport) : null;
}

function timelineCards(clubId: string, sport: Sport, name: string): {
  recent: TeamEventCard[];
  upcoming: TeamEventCard[];
} {
  const cards = teamTimeline({ id: clubId, name, sport }).map((row) => {
    const [homeTeam, awayTeam] = row.title.en.split(" vs ");
    const card: TeamEventCard = {
      id: row.id,
      title: row.title.en,
      date: row.date,
      status: row.status,
      homeTeam: homeTeam || name,
      awayTeam: awayTeam || name,
      isHome: (homeTeam || name) === name,
    };
    return card;
  });
  return {
    recent: cards.filter((row) => row.status !== "upcoming"),
    upcoming: cards.filter((row) => row.status === "upcoming"),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await context.params;
  const { searchParams } = new URL(request.url);
  const sport = asSport(searchParams.get("sport"));
  const name = searchParams.get("name") ?? undefined;

  if (!sport) {
    return NextResponse.json({ error: "sport required" }, { status: 400 });
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
  const hub =
    teamId.startsWith("honor-") || (sport !== "nba" && sport !== "soccer")
      ? null
      : await buildTeamHub(teamId, sport, name);
  if (!hub && honor) {
    const reputation = presentTeam(honor, teamSamples);
    const fixtures = timelineCards(honor.id, sport, honor.name);
    const badgeUrl = await resolveTeamBadgeUrl({
      teamName: honor.name,
      sport,
    });
    const synthetic: TeamHub = {
      id: teamId,
      name: honor.name,
      sport,
      league: honor.league,
      badgeUrl,
      description: honor.honors.en,
      roster: playersOnClub(honor.id).map((p) => ({
        id: p.id,
        name: p.name,
        position: p.positionKey,
        number: p.kitNumber,
        photoUrl: portraitFor(p.sport, p.id),
        rating: p.fcRating,
      })),
      recent: fixtures.recent,
      upcoming: fixtures.upcoming,
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
