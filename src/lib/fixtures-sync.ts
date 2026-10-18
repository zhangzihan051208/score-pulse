import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchEventsOnDay,
  fetchNextLeagueEvents,
  TSDB_LEAGUES,
  type TsdbEvent,
} from "@/lib/thesportsdb";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

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

  const day = todayUtc();
  const [nbaNext, eplNext, soccerDay, nbaDay] = await Promise.all([
    fetchNextLeagueEvents(TSDB_LEAGUES.nba, 10),
    fetchNextLeagueEvents(TSDB_LEAGUES.epl, 10),
    fetchEventsOnDay(day, "Soccer"),
    fetchEventsOnDay(day, "Basketball"),
  ]);

  const byId = new Map<string, ReturnType<typeof rowFromEvent>>();

  for (const ev of nbaNext) byId.set(ev.idEvent, rowFromEvent("nba", TSDB_LEAGUES.nba, ev));
  for (const ev of nbaDay) byId.set(ev.idEvent, rowFromEvent("nba", TSDB_LEAGUES.nba, ev));
  for (const ev of eplNext) byId.set(ev.idEvent, rowFromEvent("soccer", TSDB_LEAGUES.epl, ev));
  for (const ev of soccerDay) {
    if (ev.strLeague?.includes("Premier") || ev.strLeague?.includes("English")) {
      byId.set(ev.idEvent, rowFromEvent("soccer", TSDB_LEAGUES.epl, ev));
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
    .order("date_event", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as FixtureRow[];
}
