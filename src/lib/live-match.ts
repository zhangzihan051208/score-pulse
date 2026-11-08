import { L, S } from "./copy";
import { curatedExtraPlayers, curatedPositionKey, curatedTakesByAthlete } from "./curated/nfo-mci";
import { playerHeat } from "./player-heat";
import { matchTeamHeat } from "./team-heat";
import { dimensionIds, emptyScoresForPosition } from "./position-ratings";
import { averageScores } from "./score-aggregate";
import { overallScore } from "./score-display";
import { inferPositionKey } from "./position-infer";
import { fixtureSlug } from "./slugify";
import { alignEventToNow } from "./match-clock";
import { teamBadgeFromTsdbRaw } from "./team-badges";
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
  id_home_team?: string | null;
  id_away_team?: string | null;
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
      idTeam: p.idTeam,
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
      heat: playerHeat(sport, p.strPlayer, p.strTeam),
    });
  }

  return { performances, roster };
}

function curatedRoleLabel(positionKey: string) {
  switch (positionKey) {
    case "soccer.keeper":
      return "Goalkeeper";
    case "soccer.centerback":
      return "Centre-back";
    case "soccer.fullback":
      return "Full-back";
    case "soccer.midfielder":
    case "soccer.attackingmid":
      return "Midfielder";
    case "soccer.winger":
      return "Winger";
    case "soccer.striker":
      return "Centre-forward";
    case "nba.guard":
    case "nba.pointguard":
    case "nba.shootingguard":
      return "Guard";
    case "nba.forward":
    case "nba.smallforward":
    case "nba.powerforward":
      return "Forward";
    case "nba.center":
      return "Center";
    default:
      return "Player";
  }
}

function nameTokens(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

/** "Relvas" is the same player as "Filipe Relvas Vitó Oliveira". */
function rosterNameCovers(extraName: string, rosterName: string) {
  const extraTokens = nameTokens(extraName);
  if (extraTokens.length === 0) return false;
  const rosterTokens = new Set(nameTokens(rosterName));
  return extraTokens.every((token) => rosterTokens.has(token));
}

function applyCuratedSquad(
  eventId: string,
  sport: Sport,
  performances: Performance[],
  roster: Record<string, Athlete>,
  sides: {
    homeTeamId?: string;
    awayTeamId?: string;
    homeName: string;
    awayName: string;
  },
) {
  for (const performance of performances) {
    const name = roster[performance.athleteId]?.name;
    const positionKey = name ? curatedPositionKey(eventId, name) : undefined;
    if (positionKey) {
      performance.positionKey = positionKey;
      performance.communityAvg = { ...emptyScoresForPosition(positionKey) };
    }
  }
  const takesAlias = new Map<string, string>();
  for (const extra of curatedExtraPlayers(eventId)) {
    if (roster[extra.athleteId]) continue;
    const existing = Object.values(roster).find((athlete) =>
      rosterNameCovers(extra.name, athlete.name),
    );
    if (existing) {
      takesAlias.set(existing.id, extra.athleteId);
      const performance = performances.find((row) => row.athleteId === existing.id);
      if (performance) {
        performance.positionKey = extra.positionKey;
        performance.communityAvg = { ...emptyScoresForPosition(extra.positionKey) };
      }
      continue;
    }
    const home = extra.team === sides.homeName;
    const away = extra.team === sides.awayName;
    if (!home && !away) continue;
    roster[extra.athleteId] = {
      id: extra.athleteId,
      name: extra.name,
      shortName: shortName(extra.name),
      country: S("—"),
      team: extra.team.slice(0, 3).toUpperCase(),
      idTeam: home ? sides.homeTeamId : sides.awayTeamId,
    };
    performances.push({
      athleteId: extra.athleteId,
      positionKey: extra.positionKey,
      role: S(curatedRoleLabel(extra.positionKey)),
      highlight: S("Grade this match on the five axes for their role — not the table."),
      stats: [],
      communityAvg: { ...emptyScoresForPosition(extra.positionKey) },
      ratingCount: 0,
      heat: playerHeat(sport, extra.name, extra.team),
    });
  }
  const takesByAthlete = curatedTakesByAthlete(eventId);
  for (const performance of performances) {
    const takes =
      takesByAthlete[performance.athleteId] ??
      takesByAthlete[takesAlias.get(performance.athleteId) ?? ""];
    if (!takes?.length) continue;
    const avg = averageScores(
      takes.map((take) => take.scores),
      [...dimensionIds(performance.positionKey)],
    );
    if (!avg) continue;
    performance.communityAvg = avg;
    performance.ratingCount = takes.length;
  }
}

export function fixtureToMatchEvent(
  row: LiveFixtureRow,
  opts?: { scoreOnly?: boolean },
): MatchEvent | null {
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
  const scoreOnly = opts?.scoreOnly ?? false;
  if (performances.length === 0 && !scoreOnly) return null;

  const status = mapTsdbStatus(row.str_status ?? undefined);
  const score =
    row.int_home_score != null && row.int_away_score != null
      ? `${row.int_home_score}-${row.int_away_score}`
      : null;

  const league =
    getLeagueByTsdbId(row.league_id ?? undefined) ??
    leagueMatchesRow(row);
  const raw = (row.raw as Record<string, unknown> | null) ?? {};
  const homeTeamId =
    row.id_home_team ??
    (raw.idHomeTeam as string | undefined) ??
    undefined;
  const awayTeamId =
    row.id_away_team ??
    (raw.idAwayTeam as string | undefined) ??
    undefined;
  applyCuratedSquad(row.id_event, sport, performances, roster, {
    homeTeamId,
    awayTeamId,
    homeName: home,
    awayName: away,
  });

  const homeScore = row.int_home_score;
  const awayScore = row.int_away_score;

  const aligned = alignEventToNow({
    id: row.id_event,
    slug,
    sport,
    leagueId: league?.tsdbId ?? row.league_id ?? undefined,
    leagueSlug: league?.slug,
    homeTeamId,
    awayTeamId,
    homeTeamName: row.str_home_team ?? undefined,
    awayTeamName: row.str_away_team ?? undefined,
    homeTeamLogoUrl: teamBadgeFromTsdbRaw(raw, "home"),
    awayTeamLogoUrl: teamBadgeFromTsdbRaw(raw, "away"),
    homeScore,
    awayScore,
    statusDetail: row.str_status ?? undefined,
    title: S(title),
    subtitle: S(
      row.str_league ?? league?.label ?? (sport === "nba" ? "NBA" : "Football"),
    ),
    venue: S("—"),
    startAt: startIso(row.date_event, row.str_time),
    status,
    live: status === "live",
    summary:
      scoreOnly || performances.length === 0
        ? score
          ? L(`${score}`, `${score}`, `${score}`, `${score}`)
          : L(
              "The lineup is not posted yet.",
              "阵容还没公布。",
              "La plantilla aún no está publicada.",
              "メンバーはまだ公開されていません。",
              "Der Kader ist noch nicht veröffentlicht.",
            )
        : score
          ? L(
              `${score}. ${performances.length} players to rate.`,
              `${score}。${performances.length} 人可以打分。`,
              `${score}. ${performances.length} jugadores para puntuar.`,
              `${score}。${performances.length} 人を採点できます。`,
              `${score}. ${performances.length} Spieler zum Bewerten.`,
            )
          : L(
              `${performances.length} players to rate.`,
              `${performances.length} 人可以打分。`,
              `${performances.length} jugadores para puntuar.`,
              `${performances.length} 人を採点できます。`,
              `${performances.length} Spieler zum Bewerten.`,
            ),
    cover: SPORT_ACCENT[sport],
    teamHeat: matchTeamHeat(sport, row.str_home_team, row.str_away_team),
    performances: scoreOnly && performances.length === 0 ? [] : performances,
    roster: scoreOnly && performances.length === 0 ? {} : roster,
  });

  const lineupState: "ready" | "loading" =
    aligned.performances.length > 0 || aligned.status === "upcoming" ? "ready" : "loading";

  return { ...aligned, lineupState, live: aligned.status === "live" };
}

function listSide(event: MatchEvent, athlete: Athlete | undefined): "home" | "away" {
  if (athlete?.idTeam && event.awayTeamId && athlete.idTeam === event.awayTeamId) return "away";
  if (athlete?.idTeam && event.homeTeamId && athlete.idTeam === event.homeTeamId) return "home";
  const homeAbbrev = event.homeTeamName?.slice(0, 3).toUpperCase();
  const awayAbbrev = event.awayTeamName?.slice(0, 3).toUpperCase();
  if (athlete?.team && awayAbbrev && athlete.team === awayAbbrev) return "away";
  if (athlete?.team && homeAbbrev && athlete.team === homeAbbrev) return "home";
  return "home";
}

/** Boards only spotlight a few players. Keep the roster count, drop the rest. */
export function presentListEvent(event: MatchEvent): MatchEvent {
  const playerCount = Math.max(event.playerCount ?? 0, event.performances.length);
  const groups = new Map<string, Performance[]>();
  for (const performance of event.performances) {
    const side = listSide(event, event.roster?.[performance.athleteId]);
    const list = groups.get(side) ?? [];
    list.push(performance);
    groups.set(side, list);
  }
  const blank = L("", "", "", "");
  const kept: Performance[] = [];
  const finished = event.status === "ended";
  for (const list of groups.values()) {
    const pool = finished ? list.filter((performance) => performance.ratingCount > 0) : list;
    if (!finished) {
      pool.sort(
        (a, b) => (b.heat ?? 0) - (a.heat ?? 0) || a.athleteId.localeCompare(b.athleteId),
      );
    } else {
      pool.sort(
        (a, b) =>
          overallScore(b.communityAvg, b.positionKey) -
            overallScore(a.communityAvg, a.positionKey) ||
          b.ratingCount - a.ratingCount ||
          a.athleteId.localeCompare(b.athleteId),
      );
    }
    const chosen = finished ? pool : pool.slice(0, 4);
    kept.push(
      ...chosen.map((performance) => ({
        ...performance,
        highlight: blank,
        stats: [],
      })),
    );
  }
  const ids = new Set(kept.map((performance) => performance.athleteId));
  const roster: MatchEvent["roster"] = {};
  for (const id of ids) {
    const athlete = event.roster?.[id];
    if (athlete) roster[id] = athlete;
  }
  return {
    ...event,
    summary: blank,
    venue: blank,
    playerCount,
    performances: kept,
    roster,
  };
}
