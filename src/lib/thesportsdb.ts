/** TheSportsDB V1 — https://www.thesportsdb.com/api.php */

export const TSDB_LEAGUES = {
  nba: "4387",
  epl: "4328",
} as const;

const BASE = "https://www.thesportsdb.com/api/v1/json";

function apiKey() {
  return process.env.THESPORTSDB_API_KEY || "123";
}

async function tsdb<T>(path: string): Promise<T> {
  const url = `${BASE}/${apiKey()}/${path}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}: ${path}`);
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
};

type EventsResponse = { events: TsdbEvent[] | null };

export async function fetchNextLeagueEvents(leagueId: string, limit = 8) {
  const data = await tsdb<EventsResponse>(
    `eventsnextleague.php?id=${encodeURIComponent(leagueId)}`,
  );
  return (data.events ?? []).slice(0, limit);
}

export async function fetchEventsOnDay(date: string, sport: "Soccer" | "Basketball") {
  const data = await tsdb<EventsResponse>(
    `eventsday.php?d=${encodeURIComponent(date)}&s=${encodeURIComponent(sport)}`,
  );
  return data.events ?? [];
}

export function mapTsdbStatus(strStatus?: string): "live" | "upcoming" | "ended" {
  const s = (strStatus ?? "").toLowerCase();
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht"))
    return "live";
  if (s.includes("not started") || s.includes("ns") || s === "") return "upcoming";
  return "ended";
}
