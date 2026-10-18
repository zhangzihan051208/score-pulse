import { S } from "./copy";
import { emptyScoresForPosition } from "./position-ratings";
import { inferPositionKey } from "./position-infer";
import { fixtureSlug } from "./slugify";
import { mapTsdbStatus } from "./thesportsdb";
import type { TsdbLineupPlayer } from "./thesportsdb";
import { getLeagueByTsdbId, leagueMatchesRow } from "./leagues";
import { SPORT_ACCENT } from "./sports";
import type { Athlete, MatchEvent, Performance, Sport } from "./types";

export type StoredLineupPlayer = TsdbLineupPlayer;

export type LiveFixtureRow = {
  id_event: string;
  sport: string;
  league_id?: string | null;
  str_event: string | null;
  str_league: string | null;
  str_home_team: string | null;
  str_away_team: string | null;
  int_home_score: number | null;
  int_away_score: number | null;
  str_status: string | null;
  date_event: string | null;
  str_time: string | null;
  str_thumb: string | null;
  slug: string | null;
  lineup: StoredLineupPlayer[] | null;
  raw?: Record<string, unknown> | null;
  synced_at?: string;
};

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function startIso(date: string | null, time: string | null) {
  if (!date) return new Date().toISOString();
  const t = time?.slice(0, 8) ?? "12:00:00";
  return `${date}T${t}Z`;
}

function scoreLine(row: LiveFixtureRow) {
  if (row.int_home_score == null || row.int_away_score == null) return undefined;
  return S(`${row.int_home_score}-${row.int_away_score}`);
}

export function playersToPerformances(
  sport: Sport,
  players: StoredLineupPlayer[],
  score?: ReturnType<typeof scoreLine>,
): { performances: Performance[]; roster: Record<string, Athlete> } {
  const roster: Record<string, Athlete> = {};
  const performances: Performance[] = [];
  const seen = new Set<string>();

  for (const p of players) {
    if (!p.idPlayer || !p.strPlayer || seen.has(p.idPlayer)) continue;
    seen.add(p.idPlayer);
    const positionKey = inferPositionKey(sport, p.strPosition);
    const roleLabel = p.strPosition?.trim() || (sport === "nba" ? "Player" : "Player");
    const team = p.strTeam?.slice(0, 3).toUpperCase();
    const photoUrl =
      p.strCutout?.trim() || p.strThumb?.trim() || undefined;
    const jerseyNumber =
      p.intSquadNumber?.trim() || p.strNumber?.trim() || undefined;
    roster[p.idPlayer] = {
      id: p.idPlayer,
      name: p.strPlayer,
      shortName: shortName(p.strPlayer),
      country: S("—"),
      team,
      photoUrl,
      jerseyNumber,
    };
    const sub =
      p.strSubstitute === "Yes"
        ? S("Substitute")
        : jerseyNumber
          ? S(`#${jerseyNumber}`)
          : undefined;
    performances.push({
      athleteId: p.idPlayer,
      positionKey,
      role: S(roleLabel),
      result: sub ?? score,
      highlight: S(
        sport === "soccer"
          ? "Grade this match on the five axes for their role — not the table."
          : "Grade this game on the five axes for their role — not the season stats.",
      ),
      stats: [],
      communityAvg: { ...emptyScoresForPosition(positionKey) },
      ratingCount: 0,
    });
  }

  return { performances, roster };
}

export function fixtureToMatchEvent(row: LiveFixtureRow): MatchEvent | null {
  if (row.sport !== "nba" && row.sport !== "soccer") return null;
  const sport = row.sport as Sport;
  const home = row.str_home_team ?? "Home";
  const away = row.str_away_team ?? "Away";
  const title = row.str_event ?? `${home} vs ${away}`;
  const slug =
    row.slug ??
    fixtureSlug(home, away, row.date_event ?? undefined);
  const players = row.lineup ?? [];
  const { performances, roster } = playersToPerformances(
    sport,
    players,
    scoreLine(row),
  );
  if (performances.length === 0) return null;

  const status = mapTsdbStatus(row.str_status ?? undefined);
  const score =
    row.int_home_score != null && row.int_away_score != null
      ? `${row.int_home_score}-${row.int_away_score}`
      : null;

  const league =
    getLeagueByTsdbId(row.league_id ?? undefined) ??
    leagueMatchesRow(row);

  return {
    id: row.id_event,
    slug,
    sport,
    leagueId: league?.tsdbId ?? row.league_id ?? undefined,
    leagueSlug: league?.slug,
    title: S(title),
    subtitle: S(
      row.str_league ?? league?.label ?? (sport === "nba" ? "NBA" : "Football"),
    ),
    venue: S("—"),
    startAt: startIso(row.date_event, row.str_time),
    status,
    summary: S(
      score
        ? `Final or in-progress: ${score}. ${performances.length} players on the board.`
        : `${performances.length} players on the board — synced from TheSportsDB.`,
    ),
    cover: SPORT_ACCENT[sport],
    performances,
    roster,
    live: true,
  };
}
