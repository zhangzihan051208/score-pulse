import { createServiceClient } from "@/lib/supabase/server";
import { fixtureSlug } from "@/lib/slugify";
import {
  fixtureToMatchEvent,
  type LiveFixtureRow,
  type StoredLineupPlayer,
} from "@/lib/live-match";
import {
  dateRange,
  fetchEventById,
  fetchEventsOnDay,
  fetchLastLeagueEvents,
  fetchLineup,
  fetchNextLeagueEvents,
  fetchPastLeagueEvents,
  fetchTeamRoster,
  TSDB_LEAGUES,
  type TsdbEvent,
  type TsdbLineupPlayer,
} from "@/lib/thesportsdb";
import type { MatchEvent } from "./types";

const LIVE_SYNC_MS = 3 * 60 * 1000;
const ENRICH_LIMIT_PER_SPORT = 10;

function rowFromEvent(sport: "nba" | "soccer", leagueId: string, ev: TsdbEvent) {
  const home = ev.strHomeTeam ?? "Home";
  const away = ev.strAwayTeam ?? "Away";
  const slug = fixtureSlug(home, away, ev.dateEvent);
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
    raw: {
      ...(ev as unknown as Record<string, unknown>),
      sideline_slug: slug,
      idHomeTeam: ev.idHomeTeam,
      idAwayTeam: ev.idAwayTeam,
      lineup: [] as StoredLineupPlayer[],
    },
    synced_at: new Date().toISOString(),
  };
}

function isLiveLeagueRow(row: {
  sport: string;
  str_league: string | null;
}): boolean {
  const league = row.str_league ?? "";
  if (row.sport === "nba") {
    return league === "NBA" || league.startsWith("NBA ");
  }
  if (row.sport === "soccer") {
    return (
      league.includes("Premier League") ||
      league.includes("English Premier League")
    );
  }
  return false;
}

function hydrateFixtureRow(row: Record<string, unknown>): LiveFixtureRow {
  const raw = (row.raw as Record<string, unknown> | null) ?? {};
  const lineup =
    (row.lineup as StoredLineupPlayer[] | null) ??
    (raw.lineup as StoredLineupPlayer[] | undefined) ??
    [];
  const slug =
    (row.slug as string | null) ??
    (raw.sideline_slug as string | undefined) ??
    null;
  return {
    ...(row as LiveFixtureRow),
    slug,
    lineup,
  };
}

function enrichPlayer(
  base: StoredLineupPlayer,
  extra: TsdbLineupPlayer,
): StoredLineupPlayer {
  return {
    ...base,
    strPosition: base.strPosition?.trim() ? base.strPosition : extra.strPosition,
    intSquadNumber: base.intSquadNumber ?? extra.intSquadNumber,
    strNumber: base.strNumber ?? extra.strNumber,
    strThumb: base.strThumb ?? extra.strThumb,
    strCutout: base.strCutout ?? extra.strCutout,
  };
}

function mergePlayers(
  lineup: TsdbLineupPlayer[],
  rosters: TsdbLineupPlayer[][],
): StoredLineupPlayer[] {
  const byId = new Map<string, StoredLineupPlayer>();
  for (const p of lineup) {
    if (p.idPlayer && p.strPlayer) byId.set(p.idPlayer, p);
  }
  for (const list of rosters) {
    for (const p of list) {
      if (!p.idPlayer || !p.strPlayer) continue;
      const existing = byId.get(p.idPlayer);
      if (existing) {
        byId.set(p.idPlayer, enrichPlayer(existing, p));
      } else {
        byId.set(p.idPlayer, {
          ...p,
          strSubstitute: p.strSubstitute ?? "Yes",
        });
      }
    }
  }
  return [...byId.values()];
}

async function resolvePlayersForEvent(
  ev: TsdbEvent,
  sport: "nba" | "soccer",
): Promise<StoredLineupPlayer[]> {
  let lineup = await fetchLineup(ev.idEvent);
  let homeId = ev.idHomeTeam;
  let awayId = ev.idAwayTeam;
  if (!homeId || !awayId) {
    const detail = await fetchEventById(ev.idEvent);
    homeId = detail?.idHomeTeam ?? homeId;
    awayId = detail?.idAwayTeam ?? awayId;
  }

  if (homeId && awayId) {
    const [homeRoster, awayRoster] = await Promise.all([
      fetchTeamRoster(homeId),
      fetchTeamRoster(awayId),
    ]);
    lineup = mergePlayers(lineup, [homeRoster, awayRoster]);
  }
  return lineup;
}

export async function syncSportsDbFixtures(force = false) {
  const admin = createServiceClient();
  if (!admin) {
    return { ok: false as const, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  if (!force) {
    const { data: latest } = await admin
      .from("sportsdb_fixtures")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (
      latest?.synced_at &&
      Date.now() - new Date(latest.synced_at).getTime() < LIVE_SYNC_MS
    ) {
      return { ok: true as const, count: 0, skipped: true as const };
    }
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

  const addNba = (ev: TsdbEvent) => {
    if (
      ev.idLeague !== TSDB_LEAGUES.nba &&
      !ev.strLeague?.includes("NBA") &&
      ev.strLeague !== "NBA"
    ) {
      return;
    }
    byId.set(ev.idEvent, rowFromEvent("nba", TSDB_LEAGUES.nba, ev));
  };
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
      if (ev.idLeague === TSDB_LEAGUES.nba || ev.strLeague?.includes("NBA")) addNba(ev);
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

  const sorted = [...rows].sort((a, b) =>
    (b.date_event ?? "").localeCompare(a.date_event ?? ""),
  );
  const nbaIds = sorted
    .filter((r) => r.sport === "nba" && isLiveLeagueRow(r))
    .slice(0, ENRICH_LIMIT_PER_SPORT);
  const soccerIds = sorted
    .filter((r) => r.sport === "soccer" && isLiveLeagueRow(r))
    .slice(0, ENRICH_LIMIT_PER_SPORT);

  for (const row of [...nbaIds, ...soccerIds]) {
    const ev = row.raw as unknown as TsdbEvent;
    const sport = row.sport as "nba" | "soccer";
    try {
      const lineup = await resolvePlayersForEvent(
        { ...ev, idEvent: row.id_event },
        sport,
      );
      const enrichedRaw = {
        ...(row.raw as Record<string, unknown>),
        lineup,
        sideline_slug: (row.raw as Record<string, unknown> | undefined)
          ?.sideline_slug ?? fixtureSlug(
          row.str_home_team ?? "Home",
          row.str_away_team ?? "Away",
          row.date_event,
        ),
        idHomeTeam: ev.idHomeTeam,
        idAwayTeam: ev.idAwayTeam,
      };
      const patch = {
        raw: enrichedRaw,
        synced_at: new Date().toISOString(),
        lineup,
        slug: enrichedRaw.sideline_slug as string,
        id_home_team: ev.idHomeTeam ?? null,
        id_away_team: ev.idAwayTeam ?? null,
      };
      let { error: upErr } = await admin
        .from("sportsdb_fixtures")
        .update(patch)
        .eq("id_event", row.id_event);
      if (upErr?.message?.includes("schema cache")) {
        await admin
          .from("sportsdb_fixtures")
          .update({ raw: enrichedRaw, synced_at: patch.synced_at })
          .eq("id_event", row.id_event);
      }
    } catch {
      /* skip enrich failure for one event */
    }
  }

  return { ok: true as const, count: rows.length };
}

export type FixtureRow = LiveFixtureRow;

const FIXTURE_SELECT =
  "id_event,sport,str_event,str_league,str_home_team,str_away_team,int_home_score,int_away_score,str_status,date_event,str_time,str_thumb,slug,lineup,raw,synced_at";

const FIXTURE_SELECT_MIN =
  "id_event,sport,str_event,str_league,str_home_team,str_away_team,int_home_score,int_away_score,str_status,date_event,str_time,str_thumb,raw,synced_at";

export async function listFixtures(sports: string[], limit = 12) {
  const admin = createServiceClient();
  if (!admin) return [] as FixtureRow[];

  let res = await admin
    .from("sportsdb_fixtures")
    .select(FIXTURE_SELECT_MIN)
    .in("sport", sports)
    .order("date_event", { ascending: false })
    .order("synced_at", { ascending: false })
    .limit(Math.max(limit * 8, 40));
  if (res.error) {
    return [];
  }
  const data = (res.data as Record<string, unknown>[] | null) ?? null;
  if (!data) return [];
  return data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => isLiveLeagueRow(row))
    .slice(0, limit);
}

export async function listLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit = 12,
): Promise<MatchEvent[]> {
  const rows = await listFixtures(sports, limit);
  return rows
    .map((r) => fixtureToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e));
}

export async function getLiveMatchBySlug(slug: string) {
  const admin = createServiceClient();
  if (!admin) return null;
  const rows = await listFixtures(["nba", "soccer"], 40);
  const row = rows.find((r) => r.slug === slug);
  if (!row) return null;
  return fixtureToMatchEvent(row);
}

export async function getLiveMatchById(idEvent: string) {
  const admin = createServiceClient();
  if (!admin) return null;
  let res = await admin
    .from("sportsdb_fixtures")
    .select(FIXTURE_SELECT_MIN)
    .eq("id_event", idEvent)
    .maybeSingle();
  if (!res.data) return null;
  return fixtureToMatchEvent(hydrateFixtureRow(res.data as Record<string, unknown>));
}
