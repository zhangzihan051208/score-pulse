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
  mapTsdbStatus,
  type TsdbEvent,
  type TsdbLineupPlayer,
} from "@/lib/thesportsdb";
import { statusRank } from "@/lib/favorite-teams";
import {
  getLeagueBySlug,
  isTrackedFixture,
  leagueMatchesRow,
  SIDELINE_LEAGUES,
  tsdbEventBelongsToLeague,
  type LeagueConfig,
} from "@/lib/leagues";
import { matchSearchBoost } from "@/lib/team-popularity";
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

function rowHasLineup(row: LiveFixtureRow): boolean {
  const raw = row.raw as Record<string, unknown> | null | undefined;
  const lineup =
    row.lineup ??
    (raw?.lineup as StoredLineupPlayer[] | undefined) ??
    [];
  return lineup.length > 0;
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
    league_id:
      (row.league_id as string | null | undefined) ??
      (raw.league_id as string | undefined) ??
      null,
    id_home_team:
      (row.id_home_team as string | null | undefined) ??
      (raw.idHomeTeam as string | undefined) ??
      null,
    id_away_team:
      (row.id_away_team as string | null | undefined) ??
      (raw.idAwayTeam as string | undefined) ??
      null,
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
      if (
        upErr?.message?.includes("schema cache") ||
        upErr?.message?.includes("id_home_team") ||
        upErr?.message?.includes("id_away_team") ||
        upErr?.message?.includes("lineup") ||
        upErr?.message?.includes("slug")
      ) {
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

/** Columns that exist on all deployed schemas (team ids live in raw when columns absent). */
const FIXTURE_SELECT_CORE =
  "id_event,sport,str_event,str_league,str_home_team,str_away_team,int_home_score,int_away_score,str_status,date_event,str_time,str_thumb,raw,synced_at";

const FIXTURE_SELECT_WITH_LEAGUE = `${FIXTURE_SELECT_CORE.replace("sport,", "sport,league_id,")}`;

const FIXTURE_SELECT_WITH_TEAM_COLS = `${FIXTURE_SELECT_WITH_LEAGUE.replace("str_home_team,", "str_home_team,id_home_team,id_away_team,")}`;

type FixtureQueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

async function fetchFixtureRows(
  run: (select: string) => PromiseLike<FixtureQueryResult>,
): Promise<Record<string, unknown>[]> {
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    const res = await run(select);
    if (!res.error && res.data) {
      return res.data as Record<string, unknown>[];
    }
  }
  return [];
}

export async function listFixtures(
  sports: string[],
  limit = 12,
  leagueSlug?: string,
) {
  const admin = createServiceClient();
  if (!admin) return [] as FixtureRow[];

  const leagueFilter = leagueSlug ? getLeagueBySlug(leagueSlug) : undefined;

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", sports)
      .order("date_event", { ascending: false })
      .order("synced_at", { ascending: false })
      .limit(Math.max(limit * 12, 80))
      .then((r) => ({ data: r.data, error: r.error })),
  );
  if (!data.length) return [];
  return data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => isLiveLeagueRow(row))
    .filter((row) => rowHasLineup(row))
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

  let rowData: Record<string, unknown> | null = null;
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    const res = await admin
      .from("sportsdb_fixtures")
      .select(select)
      .eq("slug", slug)
      .maybeSingle();
    if (!res.error && res.data) {
      rowData = res.data as unknown as Record<string, unknown>;
      break;
    }
  }
  if (!rowData) {
    const wide = await fetchFixtureRows((select) =>
      admin
        .from("sportsdb_fixtures")
        .select(select)
        .in("sport", ["nba", "soccer"])
        .order("date_event", { ascending: false })
        .limit(200)
        .then((r) => ({ data: r.data, error: r.error })),
    );
    rowData =
      wide.find((row) => {
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
  let ilikeRows: Record<string, unknown>[] = [];
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    const res = await admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", ["nba", "soccer"])
      .or(
        `str_event.ilike.%${safe}%,str_home_team.ilike.%${safe}%,str_away_team.ilike.%${safe}%,str_league.ilike.%${safe}%`,
      )
      .order("date_event", { ascending: false })
      .limit(80);
    if (!res.error && res.data?.length) {
      ilikeRows = res.data as unknown as Record<string, unknown>[];
      break;
    }
  }

  const usedFallback = ilikeRows.length === 0;
  const rawRows =
    ilikeRows.length > 0
      ? ilikeRows
      : await fetchFixtureRows((select) =>
          admin
            .from("sportsdb_fixtures")
            .select(select)
            .in("sport", ["nba", "soccer"])
            .order("date_event", { ascending: false })
            .limit(150)
            .then((r) => ({ data: r.data, error: r.error })),
        );

  const qLower = q.toLowerCase();
  const rows = rawRows
    .map((row) => hydrateFixtureRow(row as Record<string, unknown>))
    .filter((row) => isTrackedFixture(row))
    .filter((row) => {
      if (!usedFallback) return true;
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

  matches.sort((a, b) => {
    const boostB = matchSearchBoost(q, b.sport as "nba" | "soccer", b.homeTeamName, b.awayTeamName);
    const boostA = matchSearchBoost(q, a.sport as "nba" | "soccer", a.homeTeamName, a.awayTeamName);
    if (boostB !== boostA) return boostB - boostA;
    return b.startAt.localeCompare(a.startAt);
  });

  return { matches: matches.slice(0, limit), players: players.slice(0, limit) };
}

export type TeamSearchHit = {
  id: string;
  name: string;
  league?: string;
  sport: "nba" | "soccer";
};

export async function searchTeamsInFixtures(
  query: string,
  sport?: "nba" | "soccer",
  leagueId?: string,
  limit = 12,
): Promise<TeamSearchHit[]> {
  const admin = createServiceClient();
  const q = query.trim().toLowerCase();
  if (!admin || q.length < 2) return [];

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", sport ? [sport] : ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(200)
      .then((r) => ({ data: r.data, error: r.error })),
  );
  const byId = new Map<string, TeamSearchHit>();

  for (const row of data) {
    const hydrated = hydrateFixtureRow(row as Record<string, unknown>);
    if (!isTrackedFixture(hydrated)) continue;
    if (leagueId && hydrated.league_id !== leagueId) continue;

    const candidates: { id?: string | null; name?: string | null }[] = [
      { id: hydrated.id_home_team, name: hydrated.str_home_team },
      { id: hydrated.id_away_team, name: hydrated.str_away_team },
    ];
    for (const c of candidates) {
      if (!c.id || !c.name) continue;
      if (!c.name.toLowerCase().includes(q)) continue;
      if (byId.has(c.id)) continue;
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        league: hydrated.str_league ?? undefined,
        sport: hydrated.sport as "nba" | "soccer",
      });
      if (byId.size >= limit) break;
    }
    if (byId.size >= limit) break;
  }

  return [...byId.values()];
}

export async function listFixturesForTeam(
  teamId: string,
  sport: "nba" | "soccer",
  teamName?: string,
  limit = 40,
): Promise<MatchEvent[]> {
  const admin = createServiceClient();
  if (!admin) return [];

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .eq("sport", sport)
      .order("date_event", { ascending: false })
      .limit(250)
      .then((r) => ({ data: r.data, error: r.error })),
  );

  const nameLower = teamName?.toLowerCase();
  const rows = data
    .map((row) => hydrateFixtureRow(row as Record<string, unknown>))
    .filter((row) => isTrackedFixture(row))
    .filter((row) => {
      if (row.id_home_team === teamId || row.id_away_team === teamId) return true;
      if (!nameLower) return false;
      return (
        row.str_home_team?.toLowerCase() === nameLower ||
        row.str_away_team?.toLowerCase() === nameLower
      );
    })
    .slice(0, limit);

  return rows
    .map((r) => fixtureToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e))
    .sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;
      return b.startAt.localeCompare(a.startAt);
    });
}

export async function refreshFixtureFromTsdb(idEvent: string): Promise<MatchEvent | null> {
  const ev = await fetchEventById(idEvent);
  const admin = createServiceClient();

  if (ev && admin) {
    const existing = await admin
      .from("sportsdb_fixtures")
      .select("raw")
      .eq("id_event", idEvent)
      .maybeSingle();
    const prevRaw = (existing.data?.raw as Record<string, unknown> | null) ?? {};
    const mergedRaw = {
      ...prevRaw,
      ...(ev as unknown as Record<string, unknown>),
      idHomeTeam: ev.idHomeTeam ?? prevRaw.idHomeTeam,
      idAwayTeam: ev.idAwayTeam ?? prevRaw.idAwayTeam,
    };
    await admin
      .from("sportsdb_fixtures")
      .update({
        int_home_score:
          ev.intHomeScore != null && ev.intHomeScore !== ""
            ? Number(ev.intHomeScore)
            : null,
        int_away_score:
          ev.intAwayScore != null && ev.intAwayScore !== ""
            ? Number(ev.intAwayScore)
            : null,
        str_status: ev.strStatus ?? null,
        str_home_team: ev.strHomeTeam ?? null,
        str_away_team: ev.strAwayTeam ?? null,
        synced_at: new Date().toISOString(),
        raw: mergedRaw,
      })
      .eq("id_event", idEvent);
  }

  return getLiveMatchById(idEvent);
}

export async function refreshLiveFixturesFromTsdb(limit = 10) {
  const admin = createServiceClient();
  if (!admin) return;

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(80)
      .then((r) => ({ data: r.data, error: r.error })),
  );

  const liveIds = data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => mapTsdbStatus(row.str_status ?? undefined) === "live")
    .slice(0, limit)
    .map((r) => r.id_event);

  for (const id of liveIds) {
    try {
      await refreshFixtureFromTsdb(id);
    } catch {
      /* one failure */
    }
  }
}

export async function getLiveMatchById(idEvent: string) {
  const admin = createServiceClient();
  if (!admin) return null;
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    const res = await admin
      .from("sportsdb_fixtures")
      .select(select)
      .eq("id_event", idEvent)
      .maybeSingle();
    if (!res.error && res.data) {
      return fixtureToMatchEvent(
        hydrateFixtureRow(res.data as unknown as Record<string, unknown>),
      );
    }
  }
  return null;
}
