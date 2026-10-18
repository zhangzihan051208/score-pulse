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
  type TsdbEvent,
  type TsdbLineupPlayer,
} from "@/lib/thesportsdb";
import {
  getLeagueBySlug,
  isTrackedFixture,
  leagueMatchesRow,
  SIDELINE_LEAGUES,
  tsdbEventBelongsToLeague,
  type LeagueConfig,
} from "@/lib/leagues";
import type { MatchEvent } from "./types";

const LIVE_SYNC_MS = 3 * 60 * 1000;
const ENRICH_PER_LEAGUE = 6;
const EVENTS_FETCH_PER_LEAGUE = 35;

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
  league_id?: string | null;
  str_league: string | null;
}): boolean {
  return isTrackedFixture(row);
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
  const days = dateRange(now, 7, 14);

  const leagueBuckets = await Promise.all(
    SIDELINE_LEAGUES.map(async (league) => {
      const [next, past, last] = await Promise.all([
        fetchNextLeagueEvents(league.tsdbId, EVENTS_FETCH_PER_LEAGUE),
        fetchPastLeagueEvents(league.tsdbId, EVENTS_FETCH_PER_LEAGUE),
        fetchLastLeagueEvents(league.tsdbId, 20),
      ]);
      return { league, events: [...next, ...past, ...last] };
    }),
  );

  const dayBuckets = await Promise.all(
    days.flatMap((d) => [
      fetchEventsOnDay(d, "Soccer"),
      fetchEventsOnDay(d, "Basketball"),
    ]),
  );

  const byId = new Map<string, ReturnType<typeof rowFromEvent>>();

  const addEvent = (ev: TsdbEvent, league: LeagueConfig) => {
    if (!tsdbEventBelongsToLeague(ev, league)) return;
    byId.set(ev.idEvent, rowFromEvent(league.sport, league.tsdbId, ev));
  };

  for (const { league, events: evs } of leagueBuckets) {
    for (const ev of evs) addEvent(ev, league);
  }

  for (const bucket of dayBuckets) {
    for (const ev of bucket) {
      for (const league of SIDELINE_LEAGUES) {
        if (league.sport === "nba" && ev.strSport !== "Basketball") continue;
        if (league.sport === "soccer" && ev.strSport !== "Soccer") continue;
        addEvent(ev, league);
      }
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
  const enrichIds: typeof sorted = [];
  for (const league of SIDELINE_LEAGUES) {
    const slice = sorted
      .filter(
        (r) =>
          isLiveLeagueRow(r) &&
          (r.league_id === league.tsdbId ||
            leagueMatchesRow(r)?.tsdbId === league.tsdbId),
      )
      .slice(0, ENRICH_PER_LEAGUE);
    enrichIds.push(...slice);
  }

  for (const row of enrichIds) {
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
  "id_event,sport,league_id,str_event,str_league,str_home_team,str_away_team,int_home_score,int_away_score,str_status,date_event,str_time,str_thumb,raw,synced_at";

export async function listFixtures(
  sports: string[],
  limit = 12,
  leagueSlug?: string,
) {
  const admin = createServiceClient();
  if (!admin) return [] as FixtureRow[];

  const leagueFilter = leagueSlug ? getLeagueBySlug(leagueSlug) : undefined;

  let res = await admin
    .from("sportsdb_fixtures")
    .select(FIXTURE_SELECT_MIN)
    .in("sport", sports)
    .order("date_event", { ascending: false })
    .order("synced_at", { ascending: false })
    .limit(Math.max(limit * 12, 80));
  if (res.error) {
    return [];
  }
  const data = (res.data as Record<string, unknown>[] | null) ?? null;
  if (!data) return [];
  return data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => isLiveLeagueRow(row))
    .filter((row) => {
      if (!leagueFilter) return true;
      return (
        row.league_id === leagueFilter.tsdbId ||
        leagueMatchesRow(row)?.tsdbId === leagueFilter.tsdbId
      );
    })
    .slice(0, limit);
}

export async function listLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit = 12,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  const rows = await listFixtures(sports, limit, leagueSlug);
  return rows
    .map((r) => fixtureToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e));
}

export async function getLiveMatchBySlug(slug: string) {
  const admin = createServiceClient();
  if (!admin) return null;

  let res = await admin
    .from("sportsdb_fixtures")
    .select(FIXTURE_SELECT_MIN)
    .eq("slug", slug)
    .maybeSingle();
  let rowData = res.data;
  if (!rowData) {
    const wide = await admin
      .from("sportsdb_fixtures")
      .select(FIXTURE_SELECT_MIN)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(200);
    rowData =
      (wide.data ?? []).find((row) => {
        const raw = row.raw as Record<string, unknown> | null;
        return raw?.sideline_slug === slug;
      }) ?? null;
  }
  if (!rowData) {
    const batch = await listFixtures(["nba", "soccer"], 120);
    const row = batch.find((r) => r.slug === slug);
    if (!row) return null;
    return fixtureToMatchEvent(row);
  }
  const row = hydrateFixtureRow(rowData as Record<string, unknown>);
  if (!isLiveLeagueRow(row)) return null;
  return fixtureToMatchEvent(row);
}

export type SearchPlayerHit = {
  athleteId: string;
  athleteName: string;
  team?: string;
  eventSlug: string;
  eventTitle: string;
  leagueLabel: string;
  sport: "nba" | "soccer";
};

export async function searchFixtures(query: string, limit = 20) {
  const admin = createServiceClient();
  const q = query.trim();
  if (!admin || q.length < 2) {
    return { matches: [] as MatchEvent[], players: [] as SearchPlayerHit[] };
  }

  const safe = q.replace(/[%_]/g, "");
  let res = await admin
    .from("sportsdb_fixtures")
    .select(FIXTURE_SELECT_MIN)
    .in("sport", ["nba", "soccer"])
    .or(
      `str_event.ilike.%${safe}%,str_home_team.ilike.%${safe}%,str_away_team.ilike.%${safe}%,str_league.ilike.%${safe}%`,
    )
    .order("date_event", { ascending: false })
    .limit(80);

  if (res.error) {
    res = await admin
      .from("sportsdb_fixtures")
      .select(FIXTURE_SELECT_MIN)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(150);
  }

  const qLower = q.toLowerCase();
  const rows = (res.data ?? [])
    .map((row) => hydrateFixtureRow(row as Record<string, unknown>))
    .filter((row) => isTrackedFixture(row))
    .filter((row) => {
      if (!res.error) return true;
      const blob = [
        row.str_event,
        row.str_home_team,
        row.str_away_team,
        row.str_league,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (blob.includes(qLower)) return true;
      const lineup =
        row.lineup ??
        ((row.raw as Record<string, unknown> | undefined)?.lineup as
          | StoredLineupPlayer[]
          | undefined) ??
        [];
      return lineup.some((p) => p.strPlayer?.toLowerCase().includes(qLower));
    });

  const matches: MatchEvent[] = [];
  const players: SearchPlayerHit[] = [];
  const seenPlayer = new Set<string>();

  for (const row of rows) {
    const event = fixtureToMatchEvent(row);
    if (!event) continue;

    const titleHit =
      row.str_event?.toLowerCase().includes(qLower) ||
      row.str_home_team?.toLowerCase().includes(qLower) ||
      row.str_away_team?.toLowerCase().includes(qLower) ||
      row.str_league?.toLowerCase().includes(qLower);

    if (titleHit && matches.length < limit) {
      matches.push(event);
    }

    const lineup =
      row.lineup ??
      ((row.raw as Record<string, unknown> | undefined)?.lineup as
        | StoredLineupPlayer[]
        | undefined) ??
      [];

    for (const p of lineup) {
      if (!p.strPlayer?.toLowerCase().includes(qLower) || !p.idPlayer) continue;
      const key = `${row.id_event}:${p.idPlayer}`;
      if (seenPlayer.has(key) || players.length >= limit) continue;
      seenPlayer.add(key);
      players.push({
        athleteId: p.idPlayer,
        athleteName: p.strPlayer,
        team: p.strTeam?.slice(0, 3).toUpperCase(),
        eventSlug: event.slug,
        eventTitle: row.str_event ?? event.title.en,
        leagueLabel: row.str_league ?? "",
        sport: row.sport as "nba" | "soccer",
      });
    }
  }

  if (matches.length < limit) {
    for (const row of rows) {
      if (matches.some((m) => m.id === row.id_event)) continue;
      const event = fixtureToMatchEvent(row);
      if (event && matches.length < limit) matches.push(event);
    }
  }

  return { matches: matches.slice(0, limit), players: players.slice(0, limit) };
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
