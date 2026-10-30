import { blockUpstream, takeUpstreamSlot, thesportsdbBudgets } from "@/lib/upstream-budget";

/** TheSportsDB V1 — https://www.thesportsdb.com/api.php */

export class UpstreamBudgetError extends Error {
  constructor() {
    super("Sports API budget exhausted");
    this.name = "UpstreamBudgetError";
  }
}

/** @deprecated use SIDELINE_LEAGUES from @/lib/leagues */
export const TSDB_LEAGUES = {
  nba: "4387",
  epl: "4328",
  laLiga: "4335",
  bundesliga: "4331",
  serieA: "4332",
  ligue1: "4334",
  ucl: "4480",
} as const;

const BASE = "https://www.thesportsdb.com/api/v1/json";

function apiKey() {
  return process.env.THESPORTSDB_API_KEY || "123";
}

async function tsdb<T>(
  path: string,
  opts?: { optional?: boolean },
): Promise<T | null> {
  const budgets = thesportsdbBudgets();
  if (!takeUpstreamSlot("thesportsdb", budgets)) {
    if (opts?.optional) return null;
    throw new UpstreamBudgetError();
  }
  const url = `${BASE}/${apiKey()}/${path}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (res.status === 429) {
    blockUpstream("thesportsdb", budgets, 120_000);
    if (opts?.optional) return null;
    throw new UpstreamBudgetError();
  }
  if (!res.ok) {
    if (opts?.optional) return null;
    throw new Error(`TheSportsDB ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export type TsdbEvent = {
  idEvent: string;
  strEvent?: string;
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strVenue?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string;
  dateEvent?: string;
  strTime?: string;
  strThumb?: string;
  strSport?: string;
  idLeague?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
};

export type TsdbLineupPlayer = {
  idPlayer: string;
  idEvent?: string;
  strPlayer: string;
  strTeam?: string;
  idTeam?: string;
  strPosition?: string;
  strHome?: string;
  strSubstitute?: string;
  intSquadNumber?: string | null;
  strNumber?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
};

type LineupResponse = { lineup: TsdbLineupPlayer[] | null };
type PlayersResponse = { player: TsdbLineupPlayer[] | null };
type EventLookupResponse = { events: TsdbEvent[] | null };

type EventsResponse = { events: TsdbEvent[] | null };

export async function fetchNextLeagueEvents(leagueId: string, limit = 8) {
  const data = await tsdb<EventsResponse>(
    `eventsnextleague.php?id=${encodeURIComponent(leagueId)}`,
  );
  return (data?.events ?? []).slice(0, limit);
}

export async function fetchPastLeagueEvents(leagueId: string, limit = 15) {
  const data = await tsdb<EventsResponse>(
    `eventspastleague.php?id=${encodeURIComponent(leagueId)}`,
  );
  return (data?.events ?? []).slice(0, limit);
}

/** Premium endpoint — free tier may 404; sync treats empty as OK. */
export async function fetchLastLeagueEvents(leagueId: string, limit = 10) {
  const data = await tsdb<EventsResponse>(
    `eventslastleague.php?id=${encodeURIComponent(leagueId)}`,
    { optional: true },
  );
  return (data?.events ?? []).slice(0, limit);
}

export function dateRange(center: Date, daysBefore: number, daysAfter: number) {
  const out: string[] = [];
  for (let d = -daysBefore; d <= daysAfter; d++) {
    const x = new Date(center);
    x.setUTCDate(x.getUTCDate() + d);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export async function fetchEventsOnDay(date: string, sport: "Soccer" | "Basketball") {
  const data = await tsdb<EventsResponse>(
    `eventsday.php?d=${encodeURIComponent(date)}&s=${encodeURIComponent(sport)}`,
    { optional: true },
  );
  return data?.events ?? [];
}

export async function fetchEventById(idEvent: string) {
  const data = await tsdb<EventLookupResponse>(
    `lookupevent.php?id=${encodeURIComponent(idEvent)}`,
    { optional: true },
  );
  return data?.events?.[0] ?? null;
}

export async function fetchLineup(idEvent: string) {
  const data = await tsdb<LineupResponse>(
    `lookuplineup.php?id=${encodeURIComponent(idEvent)}`,
    { optional: true },
  );
  return data?.lineup ?? [];
}

export type TsdbTeamBadgeFields = {
  strBadge?: string | null;
  strTeamBadge?: string | null;
};

export function pickTsdbTeamBadge(
  team: TsdbTeamBadgeFields | null | undefined,
): string | undefined {
  const url = team?.strBadge?.trim() || team?.strTeamBadge?.trim();
  return url || undefined;
}

type SearchTeamsResponse = {
  teams:
    | ({ idTeam: string; strTeam: string; strLeague?: string } & TsdbTeamBadgeFields)[]
    | null;
};

function teamSearchQueries(query: string) {
  const q = query.trim();
  const spaced = q.replace(/[-‐‑–—]/g, " ").replace(/\s+/g, " ").trim();
  const queries = [q];
  if (spaced.length >= 2 && spaced !== q) queries.push(spaced);
  return queries;
}

export async function searchTeamsByName(query: string) {
  const queries = teamSearchQueries(query);
  if (queries.length === 0 || queries[0]!.length < 2) return [];
  for (const q of queries) {
    const data = await tsdb<SearchTeamsResponse>(
      `searchteams.php?t=${encodeURIComponent(q)}`,
      { optional: true },
    );
    const teams = data?.teams ?? [];
    if (teams.length > 0) return teams;
  }
  return [];
}

export type TsdbTeam = {
  idTeam: string;
  strTeam: string;
  strLeague?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strStadium?: string;
  strDescriptionEN?: string;
  strSport?: string;
  intFormed?: string;
  strCountry?: string;
};

type TeamLookupResponse = { teams: TsdbTeam[] | null };

export async function fetchTeamById(idTeam: string) {
  const data = await tsdb<TeamLookupResponse>(
    `lookupteam.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  return data?.teams?.[0] ?? null;
}

type TeamEventsLastResponse = {
  results?: TsdbEvent[] | null;
  events?: TsdbEvent[] | null;
};

export async function fetchTeamEventsLast(idTeam: string, limit = 8) {
  const data = await tsdb<TeamEventsLastResponse>(
    `eventslast.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  return (data?.results ?? data?.events ?? []).slice(0, limit);
}

export async function fetchTeamEventsNext(idTeam: string, limit = 8) {
  const data = await tsdb<EventsResponse>(
    `eventsnext.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  return (data?.events ?? []).slice(0, limit);
}

type TrophiesResponse = {
  trophies?: {
    strTrophy?: string;
    strSeason?: string;
    strLeague?: string;
  }[] | null;
};

export async function fetchTeamHonours(idTeam: string) {
  const data = await tsdb<TrophiesResponse>(
    `lookup_all_honours.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  if (data?.trophies?.length) return data.trophies;
  const alt = await tsdb<TrophiesResponse>(
    `lookuphonours.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  return alt?.trophies ?? [];
}

export async function fetchTeamRoster(idTeam: string) {
  const data = await tsdb<PlayersResponse>(
    `lookup_all_players.php?id=${encodeURIComponent(idTeam)}`,
    { optional: true },
  );
  return data?.player ?? [];
}

type PlayerLookupResponse = { players: TsdbLineupPlayer[] | null };

export async function fetchPlayerById(idPlayer: string) {
  const data = await tsdb<PlayerLookupResponse>(
    `lookupplayer.php?id=${encodeURIComponent(idPlayer)}`,
    { optional: true },
  );
  return data?.players?.[0] ?? null;
}

export function mapTsdbStatus(strStatus?: string): "live" | "upcoming" | "ended" {
  const s = (strStatus ?? "").toLowerCase();
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht"))
    return "live";
  if (s.includes("not started") || s.includes("ns") || s === "") return "upcoming";
  return "ended";
}
