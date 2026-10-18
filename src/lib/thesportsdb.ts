/** TheSportsDB V1 — https://www.thesportsdb.com/api.php */

export const TSDB_LEAGUES = {
  nba: "4387",
  epl: "4328",
} as const;

const BASE = "https://www.thesportsdb.com/api/v1/json";

function apiKey() {
  return process.env.THESPORTSDB_API_KEY || "123";
}

async function tsdb<T>(
  path: string,
  opts?: { optional?: boolean },
): Promise<T | null> {
  const url = `${BASE}/${apiKey()}/${path}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
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
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string;
  dateEvent?: string;
  strTime?: string;
  strThumb?: string;
  strSport?: string;
  idLeague?: string;
};

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

export function mapTsdbStatus(strStatus?: string): "live" | "upcoming" | "ended" {
  const s = (strStatus ?? "").toLowerCase();
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht"))
    return "live";
  if (s.includes("not started") || s.includes("ns") || s === "") return "upcoming";
  return "ended";
}
