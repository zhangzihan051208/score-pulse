import { createServiceClient } from "@/lib/supabase/server";
import {
  dateRange,
  fetchEventsOnDay,
  fetchLastLeagueEvents,
  fetchNextLeagueEvents,
  fetchPastLeagueEvents,
  TSDB_LEAGUES,
  type TsdbEvent,
} from "@/lib/thesportsdb";

function rowFromEvent(sport: "nba" | "soccer", leagueId: string, ev: TsdbEvent) {
  return {
    id_event: ev.idEvent,
    sport,
    league_id: leagueId,
    str_event: ev.strEvent ?? null,
    str_league: ev.strLeague ?? null,
    str_home_team: ev.strHomeTeam ?? null,
    str_away_team: ev.strAwayTeam ?? null,
    int_home_score: ev.intHomeScore ? Number(ev.intHomeScore) : null,
    int_away_score: ev.intAwayScore ? Number(ev.intAwayScore) : null,
    str_status: ev.strStatus ?? null,
    date_event: ev.dateEvent ?? null,
    str_time: ev.strTime ?? null,
    str_thumb: ev.strThumb ?? null,
    raw: ev as unknown as Record<string, unknown>,
    synced_at: new Date().toISOString(),
  };
}

export async function syncSportsDbFixtures() {
  const admin = createServiceClient();
  if (!admin) {
    return { ok: false as const, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const now = new Date();
  const days = dateRange(now, 5, 10);

  const [
    nbaNext,
    nbaPast,
    nbaLast,
    eplNext,
    eplPast,
    eplLast,
    ...dayBuckets
  ] = await Promise.all([
    fetchNextLeagueEvents(TSDB_LEAGUES.nba, 20),
    fetchPastLeagueEvents(TSDB_LEAGUES.nba, 20),
    fetchLastLeagueEvents(TSDB_LEAGUES.nba, 15),
    fetchNextLeagueEvents(TSDB_LEAGUES.epl, 20),
    fetchPastLeagueEvents(TSDB_LEAGUES.epl, 20),
    fetchLastLeagueEvents(TSDB_LEAGUES.epl, 15),
    ...days.flatMap((d) => [
      fetchEventsOnDay(d, "Soccer"),
      fetchEventsOnDay(d, "Basketball"),
    ]),
  ]);

  const byId = new Map<string, ReturnType<typeof rowFromEvent>>();

  const addNba = (ev: TsdbEvent) =>
    byId.set(ev.idEvent, rowFromEvent("nba", TSDB_LEAGUES.nba, ev));
  const addEpl = (ev: TsdbEvent) => {
    if (
      !ev.strLeague ||
      ev.strLeague.includes("Premier") ||
      ev.strLeague.includes("English") ||
      ev.idLeague === TSDB_LEAGUES.epl
    ) {
      byId.set(ev.idEvent, rowFromEvent("soccer", TSDB_LEAGUES.epl, ev));
    }
  };

  for (const ev of nbaNext) addNba(ev);
  for (const ev of nbaPast) addNba(ev);
  for (const ev of nbaLast) addNba(ev);
  for (const ev of eplNext) addEpl(ev);
  for (const ev of eplPast) addEpl(ev);
  for (const ev of eplLast) addEpl(ev);

  for (const bucket of dayBuckets) {
    for (const ev of bucket) {
      if (ev.strSport === "Basketball" || ev.strLeague?.includes("NBA")) addNba(ev);
      else if (ev.strSport === "Soccer") addEpl(ev);
    }
  }

  const rows = [...byId.values()];
  if (rows.length === 0) {
    return { ok: true as const, count: 0 };
  }

  const { error } = await admin.from("sportsdb_fixtures").upsert(rows, {
    onConflict: "id_event",
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, count: rows.length };
}

export type FixtureRow = {
  id_event: string;
  sport: string;
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
};

export async function listFixtures(sports: string[], limit = 12) {
  const admin = createServiceClient();
  if (!admin) return [] as FixtureRow[];

  const { data, error } = await admin
    .from("sportsdb_fixtures")
    .select(
      "id_event,sport,str_event,str_league,str_home_team,str_away_team,int_home_score,int_away_score,str_status,date_event,str_time,str_thumb",
    )
    .in("sport", sports)
    .order("date_event", { ascending: false })
    .order("synced_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as FixtureRow[];
}
