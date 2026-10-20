import { S } from "@/lib/copy";
import { emptyScoresForPosition } from "@/lib/position-ratings";
import type { EsportsGameConfig } from "@/lib/esports-games";
import type { KrMatch, KrPlayerBoardTeam } from "@/lib/kashrock";
import { SPORT_ACCENT } from "@/lib/sports";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

function mapStatus(status?: string): MatchEvent["status"] {
  if (status === "current" || status === "live") return "live";
  if (status === "finished" || status === "completed") return "ended";
  return "upcoming";
}

export function kashRockEventSlug(gameSlug: string, match: KrMatch): string {
  const tail = match.slug?.trim() || match.kr_match_id.replace(/^kr_[^_]+_/, "");
  return `es-${gameSlug}-${tail}`.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 120);
}

function playerId(teamId: string, nickname: string) {
  return `${teamId}-${nickname}`.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
}

function boardToPerformances(
  teams: KrPlayerBoardTeam[] | undefined,
  homeName: string,
  awayName: string,
  homeId: string,
  awayId: string,
) {
  const performances: Performance[] = [];
  const roster: Record<string, Athlete> = {};
  const positionKey = "esports.player" as const;

  for (const block of teams ?? []) {
    const teamName = block.team ?? "";
    const tag =
      teamName === homeName
        ? homeName.slice(0, 3).toUpperCase()
        : teamName === awayName
          ? awayName.slice(0, 3).toUpperCase()
          : teamName.slice(0, 3).toUpperCase();
    const teamKey = teamName === homeName ? homeId : teamName === awayName ? awayId : teamName;

    for (const p of block.players ?? []) {
      const name = p.nickname?.trim() || p.real_name?.trim();
      if (!name) continue;
      const id = playerId(teamKey, name);
      roster[id] = {
        id,
        name,
        shortName: name.slice(0, 2).toUpperCase(),
        country: S("—"),
        team: tag,
        photoUrl: p.icon_url,
      };
      performances.push({
        athleteId: id,
        positionKey,
        role: S(p.role?.trim() || "Player"),
        highlight: S("Grade this series on five axes — not the season stat line."),
        stats: [],
        communityAvg: { ...emptyScoresForPosition(positionKey) },
        ratingCount: 0,
      });
    }
  }

  return { performances, roster };
}

export function kashRockMatchToEvent(
  game: EsportsGameConfig,
  match: KrMatch,
): MatchEvent | null {
  if (!match.kr_match_id) return null;

  const homeName = match.team1 ?? "Team 1";
  const awayName = match.team2 ?? "Team 2";
  const homeId = match.team1_id ?? "home";
  const awayId = match.team2_id ?? "away";
  const status = mapStatus(match.status);
  const slug = kashRockEventSlug(game.slug, match);
  const bo = match.metadata?.number_of_games
    ? `BO${match.metadata.number_of_games}`
    : "";
  const startAt =
    match.event_time ??
    match.metadata?.begin_at ??
    match.metadata?.scheduled_at ??
    new Date().toISOString();

  const boardTeams = match.include?.player_board?.teams;
  const { performances, roster } = boardToPerformances(
    boardTeams,
    homeName,
    awayName,
    homeId,
    awayId,
  );

  const s1 = match.score1 ?? null;
  const s2 = match.score2 ?? null;
  const scoreLine =
    s1 != null && s2 != null && (status !== "upcoming" || s1 + s2 > 0)
      ? `${s1}-${s2}`
      : undefined;

  const subtitle =
    [match.competition, match.stage_name].filter(Boolean).join(" · ") || "Esports";

  return {
    id: match.kr_match_id,
    slug,
    sport: "esports",
    leagueSlug: game.slug,
    homeTeamId: homeId,
    awayTeamId: awayId,
    homeTeamName: homeName,
    awayTeamName: awayName,
    homeScore: s1,
    awayScore: s2,
    statusDetail: match.status,
    title: S(`${homeName} vs ${awayName}`),
    subtitle: S(subtitle),
    venue: S(bo || (match.lan ? "LAN" : "Online")),
    startAt,
    status,
    summary: S(
      scoreLine
        ? `${scoreLine}${bo ? ` · ${bo}` : ""} · ${performances.length} players`
        : `${performances.length} players on the card`,
    ),
    cover: SPORT_ACCENT.esports,
    performances,
    roster,
    live: status === "live",
  };
}
