import { unstable_cache } from "next/cache";
import { getLeagueBySlug } from "@/lib/leagues";
import {
  fetchLookupTable,
  fetchSeasonEvents,
  mapTsdbStatus,
  type TsdbEvent,
  type TsdbTableRow,
} from "@/lib/thesportsdb";
import type { EventStatus } from "@/lib/types";

export type StandingRow = {
  rank: number;
  teamId: string;
  team: string;
  badgeUrl?: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** Oldest match on the left, latest on the right. Letters are W, D, L. */
  form: string;
  note?: string;
};

export type RoundMatch = {
  id: string;
  homeId?: string;
  awayId?: string;
  homeName: string;
  awayName: string;
  homeBadge?: string;
  awayBadge?: string;
  homeScore: number | null;
  awayScore: number | null;
  startAt: string;
  status: EventStatus;
};

export type LeagueTablePayload = {
  slug: string;
  season: string;
  sport: "nba" | "soccer";
  groups: { id: "table" | "east" | "west"; rows: StandingRow[] }[];
  round: { matches: RoundMatch[] } | null;
};

const NBA_EAST = new Set(
  [
    "Atlanta Hawks",
    "Boston Celtics",
    "Brooklyn Nets",
    "Charlotte Hornets",
    "Chicago Bulls",
    "Cleveland Cavaliers",
    "Detroit Pistons",
    "Indiana Pacers",
    "Miami Heat",
    "Milwaukee Bucks",
    "New York Knicks",
    "Orlando Magic",
    "Philadelphia 76ers",
    "Toronto Raptors",
    "Washington Wizards",
  ].map(foldClub),
);

const NBA_WEST = new Set(
  [
    "Dallas Mavericks",
    "Denver Nuggets",
    "Golden State Warriors",
    "Houston Rockets",
    "Los Angeles Clippers",
    "Los Angeles Lakers",
    "Memphis Grizzlies",
    "Minnesota Timberwolves",
    "New Orleans Pelicans",
    "Oklahoma City Thunder",
    "Phoenix Suns",
    "Portland Trail Blazers",
    "Sacramento Kings",
    "San Antonio Spurs",
    "Utah Jazz",
  ].map(foldClub),
);

export function foldClub(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

export function hasStandings(slug: string | undefined | null): slug is string {
  if (!slug) return false;
  const league = getLeagueBySlug(slug);
  return league?.sport === "nba" || league?.sport === "soccer";
}

export function standingsPath(sport: string, leagueSlug: string) {
  if (sport === "nba") return "/boards/nba/table";
  return `/boards/${sport}/${leagueSlug}/table`;
}

export function findStanding(
  payload: LeagueTablePayload | null | undefined,
  teamId?: string | null,
  teamName?: string | null,
): StandingRow | undefined {
  if (!payload) return undefined;
  const rows = payload.groups.flatMap((group) => group.rows);
  if (teamId) {
    const byId = rows.find((row) => row.teamId === teamId);
    if (byId) return byId;
  }
  if (!teamName) return undefined;
  const folded = foldClub(teamName);
  return rows.find((row) => foldClub(row.team) === folded);
}

export function currentSeason(now = new Date()) {
  const year = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function previousSeason(season: string) {
  const start = Number(season.slice(0, 4));
  if (!Number.isFinite(start)) return season;
  return `${start - 1}-${start}`;
}

function num(value: string | number | null | undefined) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function score(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** TheSportsDB lists the latest match first. The board shows time left to right. */
function formFromProvider(raw: string | undefined) {
  const letters = (raw ?? "").toUpperCase().replace(/[^WDL]/g, "");
  return letters.slice(0, 5).split("").reverse().join("");
}

function blank(slug: string, sport: "nba" | "soccer", season: string): LeagueTablePayload {
  return { slug, season, sport, groups: [], round: null };
}

function fromLookup(
  slug: string,
  season: string,
  rows: TsdbTableRow[],
): LeagueTablePayload {
  const sorted = [...rows].sort((a, b) => num(a.intRank) - num(b.intRank));
  return {
    slug,
    season,
    sport: "soccer",
    groups: [
      {
        id: "table",
        rows: sorted.map((row, index) => {
          const goalsFor = num(row.intGoalsFor);
          const goalsAgainst = num(row.intGoalsAgainst);
          return {
            rank: num(row.intRank) || index + 1,
            teamId: row.idTeam ?? "",
            team: row.strTeam ?? "",
            badgeUrl: row.strBadge || undefined,
            played: num(row.intPlayed),
            win: num(row.intWin),
            draw: num(row.intDraw),
            loss: num(row.intLoss),
            goalsFor,
            goalsAgainst,
            goalDiff: row.intGoalDifference != null && row.intGoalDifference !== ""
              ? num(row.intGoalDifference)
              : goalsFor - goalsAgainst,
            points: num(row.intPoints),
            form: formFromProvider(row.strForm),
            note: row.strDescription || undefined,
          };
        }),
      },
    ],
    round: null,
  };
}

type Tallied = {
  teamId: string;
  team: string;
  badgeUrl?: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  results: { at: string; mark: "W" | "D" | "L" }[];
};

function tally(events: TsdbEvent[], accept: (event: TsdbEvent) => boolean) {
  const clubs = new Map<string, Tallied>();
  const ensure = (id: string | undefined, name: string | undefined, badge?: string) => {
    if (!id || !name) return null;
    let row = clubs.get(id);
    if (!row) {
      row = {
        teamId: id,
        team: name,
        badgeUrl: badge,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        results: [],
      };
      clubs.set(id, row);
    } else if (!row.badgeUrl && badge) {
      row.badgeUrl = badge;
    }
    return row;
  };

  for (const event of events) {
    if (!accept(event)) continue;
    ensure(event.idHomeTeam, event.strHomeTeam, event.strHomeTeamBadge);
    ensure(event.idAwayTeam, event.strAwayTeam, event.strAwayTeamBadge);
    const status = mapTsdbStatus(event.strStatus);
    if (status !== "ended") continue;
    const homeScore = score(event.intHomeScore);
    const awayScore = score(event.intAwayScore);
    if (homeScore == null || awayScore == null) continue;
    const home = ensure(event.idHomeTeam, event.strHomeTeam, event.strHomeTeamBadge);
    const away = ensure(event.idAwayTeam, event.strAwayTeam, event.strAwayTeamBadge);
    if (!home || !away) continue;
    const at = startIso(event.dateEvent, event.strTime);
    applyResult(home, away, homeScore, awayScore, at);
  }
  return clubs;
}

function applyResult(home: Tallied, away: Tallied, homeScore: number, awayScore: number, at: string) {
  home.played += 1;
  away.played += 1;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;
  const homeMark = homeScore === awayScore ? "D" : homeScore > awayScore ? "W" : "L";
  const awayMark = homeMark === "D" ? "D" : homeMark === "W" ? "L" : "W";
  if (homeMark === "W") {
    home.win += 1;
    away.loss += 1;
  } else if (homeMark === "L") {
    home.loss += 1;
    away.win += 1;
  } else {
    home.draw += 1;
    away.draw += 1;
  }
  home.results.push({ at, mark: homeMark });
  away.results.push({ at, mark: awayMark });
}

function formOf(row: Tallied) {
  return [...row.results]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-5)
    .map((result) => result.mark)
    .join("");
}

function toRow(row: Tallied, rank: number): StandingRow {
  return {
    rank,
    teamId: row.teamId,
    team: row.team,
    badgeUrl: row.badgeUrl,
    played: row.played,
    win: row.win,
    draw: row.draw,
    loss: row.loss,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalsFor - row.goalsAgainst,
    points: row.win * 3 + row.draw,
    form: formOf(row),
  };
}

function isLeaguePhase(events: TsdbEvent[]) {
  if (events.length !== 18) return false;
  const teams = new Set<string>();
  for (const event of events) {
    if (event.idHomeTeam) teams.add(event.idHomeTeam);
    if (event.idAwayTeam) teams.add(event.idAwayTeam);
  }
  return teams.size >= 30;
}

function byRound(events: TsdbEvent[]) {
  const groups = new Map<string, TsdbEvent[]>();
  for (const event of events) {
    const key = String(event.intRound ?? "");
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return [...groups.values()];
}

export function buildUclTable(events: TsdbEvent[], slug: string, season: string): LeagueTablePayload {
  const phaseRounds = byRound(events).filter(isLeaguePhase);
  const phase = phaseRounds.flat();
  const clubs = [...tally(phase, () => true).values()];
  clubs.sort((a, b) => {
    const points = b.win * 3 + b.draw - (a.win * 3 + a.draw);
    if (points !== 0) return points;
    const gd = b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
    if (gd !== 0) return gd;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });
  return {
    slug,
    season,
    sport: "soccer",
    groups: [{ id: "table", rows: clubs.map((row, index) => toRow(row, index + 1)) }],
    round: pickRound(phaseRounds),
  };
}

function pickRound(rounds: TsdbEvent[][]): LeagueTablePayload["round"] {
  const pending = rounds
    .map((matches) => ({
      matches,
      nextAt: matches
        .filter((match) => mapTsdbStatus(match.strStatus) !== "ended")
        .map((match) => startIso(match.dateEvent, match.strTime))
        .sort()[0],
    }))
    .filter((round) => round.nextAt)
    .sort((a, b) => a.nextAt!.localeCompare(b.nextAt!));
  const chosen = pending[0]?.matches ?? rounds[rounds.length - 1];
  if (!chosen?.length) return null;
  const matches = chosen
    .map(toRoundMatch)
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.homeName.localeCompare(b.homeName));
  return { matches };
}

function toRoundMatch(event: TsdbEvent): RoundMatch {
  return {
    id: event.idEvent,
    homeId: event.idHomeTeam,
    awayId: event.idAwayTeam,
    homeName: event.strHomeTeam ?? "Home",
    awayName: event.strAwayTeam ?? "Away",
    homeBadge: event.strHomeTeamBadge,
    awayBadge: event.strAwayTeamBadge,
    homeScore: score(event.intHomeScore),
    awayScore: score(event.intAwayScore),
    startAt: startIso(event.dateEvent, event.strTime),
    status: mapTsdbStatus(event.strStatus),
  };
}

function startIso(date?: string | null, time?: string | null) {
  if (!date) return new Date(0).toISOString();
  const t = time?.slice(0, 8) ?? "12:00:00";
  return `${date}T${t}Z`;
}

/** Preseason is round 500. Everything else in the season file counts. */
function isNbaRegular(event: TsdbEvent) {
  return String(event.intRound ?? "") !== "500";
}

export function buildNbaTable(events: TsdbEvent[], slug: string, season: string): LeagueTablePayload {
  const clubs = [...tally(events, isNbaRegular).values()];
  const east: Tallied[] = [];
  const west: Tallied[] = [];
  for (const club of clubs) {
    const folded = foldClub(club.team);
    if (NBA_EAST.has(folded)) east.push(club);
    else if (NBA_WEST.has(folded)) west.push(club);
  }
  const rankSide = (list: Tallied[]) => {
    list.sort((a, b) => {
      const pct = winPct(b) - winPct(a);
      if (pct !== 0) return pct;
      if (b.win !== a.win) return b.win - a.win;
      return a.team.localeCompare(b.team);
    });
    return list.map((row, index) => toRow(row, index + 1));
  };
  return {
    slug,
    season,
    sport: "nba",
    groups: [
      { id: "east", rows: rankSide(east) },
      { id: "west", rows: rankSide(west) },
    ],
    round: null,
  };
}

function winPct(row: Tallied) {
  if (row.played === 0) return 0;
  return row.win / row.played;
}

async function loadLeagueTable(slug: string): Promise<LeagueTablePayload> {
  const league = getLeagueBySlug(slug);
  const sport = league?.sport === "nba" ? "nba" : "soccer";
  const season = currentSeason();
  if (!league || (league.sport !== "nba" && league.sport !== "soccer")) {
    return blank(slug, sport, season);
  }
  const seasons = [season, previousSeason(season)];

  if (league.sport === "soccer" && league.slug !== "champions-league") {
    for (const candidate of seasons) {
      const rows = await fetchLookupTable(league.tsdbId, candidate);
      if (rows.length >= 4) return fromLookup(league.slug, candidate, rows);
    }
    return blank(league.slug, "soccer", season);
  }

  if (league.slug === "champions-league") {
    for (const candidate of seasons) {
      const events = await fetchSeasonEvents(league.tsdbId, candidate);
      if (events.length < 18) continue;
      const built = buildUclTable(events, league.slug, candidate);
      if (built.groups[0]?.rows.length) return built;
    }
    return blank(league.slug, "soccer", season);
  }

  for (const candidate of seasons) {
    const events = await fetchSeasonEvents(league.tsdbId, candidate);
    if (events.length < 30) continue;
    const built = buildNbaTable(events, league.slug, candidate);
    if (built.groups.some((group) => group.rows.length > 0)) return built;
  }
  return blank(league.slug, "nba", season);
}

export function getLeagueTable(slug: string) {
  return unstable_cache(() => loadLeagueTable(slug), ["league-table-v1", slug], {
    revalidate: 6 * 60 * 60,
  })();
}
