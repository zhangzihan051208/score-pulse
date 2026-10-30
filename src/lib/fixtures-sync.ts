import { createServiceClient } from "@/lib/supabase/server";
import { fixtureSlug } from "@/lib/slugify";
import {
  fixtureToMatchEvent,
  type LiveFixtureRow,
  type StoredLineupPlayer,
} from "@/lib/live-match";
import {
  fetchEventById,
  fetchLastLeagueEvents,
  fetchLineup,
  fetchNextLeagueEvents,
  fetchPastLeagueEvents,
  fetchTeamRoster,
  mapTsdbStatus,
  UpstreamBudgetError,
  type TsdbEvent,
  type TsdbLineupPlayer,
} from "@/lib/thesportsdb";
import { SCHEDULE_SYNC_MS } from "@/lib/fixtures-cadence";
import { thesportsdbBudgets, upstreamAllows } from "@/lib/upstream-budget";
import { revalidateTag } from "next/cache";
import { statusRank } from "@/lib/favorite-teams";
import {
  getLeagueBySlug,
  getLeagueByTsdbId,
  isTrackedFixture,
  leagueMatchesRow,
  SIDELINE_LEAGUES,
  tsdbEventBelongsToLeague,
  type LeagueConfig,
} from "@/lib/leagues";
import { fillMissingTeamLogos } from "@/lib/team-badges";
import { enrichTeamSearchHit } from "@/lib/team-league";
import { matchSearchBoost } from "@/lib/team-popularity";
import {
  getDegradedMode,
  isBenignSupabaseSchemaError,
  markSupabaseUnavailable,
  markTsdbUnavailable,
  noteSupabaseHealthy,
  UPSTREAM_TIMEOUT_MS,
  withUpstreamTimeout,
} from "@/lib/service-degraded";
import {
  fixtureRowStatus,
  isVisibleFixtureRow,
  isVisibleMatchStatus,
  shouldPruneFixtureRow,
  shouldRetainFixtureRow,
} from "@/lib/fixture-retention";
import type { MatchEvent } from "./types";

const LIVE_SYNC_MS = SCHEDULE_SYNC_MS;
const ENRICH_SYNC_MS = 4 * 60 * 1000;
const ENRICH_CONCURRENCY = 1;
/** Upcoming fixtures within this many days may get roster enrichment. */
const ENRICH_UPCOMING_DAYS = 3;
/** Recently ended fixtures within this many days may still get rosters. */
const ENRICH_ENDED_DAYS = 3;

function fixtureRowToMatchEvent(row: LiveFixtureRow): MatchEvent | null {
  const hasLineup = rowHasLineup(row);
  const event = fixtureToMatchEvent(row, { scoreOnly: !hasLineup });
  return event;
}

async function withTeamLogos(event: MatchEvent | null): Promise<MatchEvent | null> {
  if (!event) return null;
  const [filled] = await fillMissingTeamLogos([event]);
  return filled ?? null;
}
const ENRICH_PER_LEAGUE = 10;
const EVENTS_FETCH_PER_LEAGUE = 35;

function parseTsdbScore(value: string | undefined | null): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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
    int_home_score: parseTsdbScore(ev.intHomeScore),
    int_away_score: parseTsdbScore(ev.intAwayScore),
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

function fixtureScoreFromRow(
  row: Record<string, unknown>,
  raw: Record<string, unknown>,
  column: "int_home_score" | "int_away_score",
  rawKey: "intHomeScore" | "intAwayScore",
): number | null {
  const direct = row[column];
  if (direct != null && direct !== "") {
    const n = Number(direct);
    if (Number.isFinite(n)) return n;
  }
  return parseTsdbScore(
    typeof raw[rawKey] === "string" || typeof raw[rawKey] === "number"
      ? String(raw[rawKey])
      : null,
  );
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
    int_home_score: fixtureScoreFromRow(row, raw, "int_home_score", "intHomeScore"),
    int_away_score: fixtureScoreFromRow(row, raw, "int_away_score", "intAwayScore"),
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

function parseFixtureDate(date: string | null | undefined): number | null {
  if (!date) return null;
  return new Date(`${date}T12:00:00Z`).getTime();
}

/** Whether this row should receive a background roster fetch. */
export function shouldEnrichFixtureRow(row: LiveFixtureRow): boolean {
  if (rowHasLineup(row)) return false;
  const status = mapTsdbStatus(row.str_status ?? undefined);
  if (status === "live") return true;
  const t = parseFixtureDate(row.date_event);
  if (t == null) return false;
  const now = Date.now();
  const dayMs = 86_400_000;
  if (status === "upcoming") {
    return t >= now - dayMs && t <= now + ENRICH_UPCOMING_DAYS * dayMs;
  }
  if (status === "ended") {
    return t >= now - ENRICH_ENDED_DAYS * dayMs && t <= now + dayMs;
  }
  return false;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function fetchLeagueEventBuckets(): Promise<
  { league: LeagueConfig; events: TsdbEvent[] }[]
> {
  const out: { league: LeagueConfig; events: TsdbEvent[] }[] = [];
  for (const league of SIDELINE_LEAGUES) {
    if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) break;
    try {
      const [next, past, last] = await Promise.all([
        withUpstreamTimeout(
          fetchNextLeagueEvents(league.tsdbId, EVENTS_FETCH_PER_LEAGUE),
          UPSTREAM_TIMEOUT_MS,
          markTsdbUnavailable,
        ),
        withUpstreamTimeout(
          fetchPastLeagueEvents(league.tsdbId, EVENTS_FETCH_PER_LEAGUE),
          UPSTREAM_TIMEOUT_MS,
          markTsdbUnavailable,
        ),
        withUpstreamTimeout(
          fetchLastLeagueEvents(league.tsdbId, 20),
          UPSTREAM_TIMEOUT_MS,
          markTsdbUnavailable,
        ),
      ]);
      out.push({ league, events: [...next, ...past, ...last] });
    } catch (error) {
      if (error instanceof UpstreamBudgetError) break;
      throw error;
    }
  }
  return out;
}

function mergeLeagueBucketsIntoRows(
  leagueBuckets: { league: LeagueConfig; events: TsdbEvent[] }[],
): ReturnType<typeof rowFromEvent>[] {
  const byId = new Map<string, ReturnType<typeof rowFromEvent>>();

  const addEvent = (ev: TsdbEvent, league: LeagueConfig) => {
    if (league.sport !== "nba" && league.sport !== "soccer") return;
    if (!tsdbEventBelongsToLeague(ev, league)) return;
    const row = rowFromEvent(league.sport, league.tsdbId, ev);
    if (!shouldRetainFixtureRow(row)) return;
    byId.set(ev.idEvent, row);
  };

  for (const { league, events: evs } of leagueBuckets) {
    for (const ev of evs) addEvent(ev, league);
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

let lastEnrichFinished = 0;

async function applyLineupEnrichToRow(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  row: LiveFixtureRow,
): Promise<boolean> {
  const ev = row.raw as unknown as TsdbEvent;
  const sport = row.sport as "nba" | "soccer";
  try {
    const lineup = await resolvePlayersForEvent(
      { ...ev, idEvent: row.id_event },
      sport,
    );
    if (lineup.length === 0) return false;
    const enrichedRaw = {
      ...(row.raw as Record<string, unknown>),
      lineup,
      sideline_slug:
        (row.raw as Record<string, unknown> | undefined)?.sideline_slug ??
        fixtureSlug(
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
    return true;
  } catch {
    return false;
  }
}

/** Fast path: schedules/scores only — no per-match roster calls. */
export async function syncFixturesFast(force = false) {
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

  if (getDegradedMode().cacheOnly) {
    return { ok: true as const, count: 0, skipped: true as const };
  }

  let leagueBuckets: Awaited<ReturnType<typeof fetchLeagueEventBuckets>>;
  try {
    leagueBuckets = await fetchLeagueEventBuckets();
  } catch {
    markTsdbUnavailable();
    return { ok: false as const, error: "TheSportsDB unavailable — serving cache." };
  }

  const rows = mergeLeagueBucketsIntoRows(leagueBuckets);
  if (rows.length === 0) {
    return { ok: true as const, count: 0 };
  }

  const rowsToWrite = await mergeSyncRowsWithExistingLineups(admin, rows);

  const { error } = await admin.from("sportsdb_fixtures").upsert(rowsToWrite, {
    onConflict: "id_event",
  });
  if (error) return { ok: false as const, error: error.message };

  const pruned = await pruneExpiredFixturesFromDb(admin);

  revalidateTag("fixtures", "max");
  return { ok: true as const, count: rows.length, pruned };
}

/** Drop ended fixtures older than the retention window. */
export async function pruneExpiredFixturesFromDb(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
) {
  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(2000)
      .then((r) => ({ data: r.data, error: r.error })),
  );
  const expiredIds = data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => shouldPruneFixtureRow(row))
    .map((row) => row.id_event);
  if (expiredIds.length === 0) return 0;

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < expiredIds.length; i += chunkSize) {
    const chunk = expiredIds.slice(i, i + chunkSize);
    const { error } = await admin.from("sportsdb_fixtures").delete().in("id_event", chunk);
    if (error) break;
    deleted += chunk.length;
  }
  return deleted;
}

/** Fast sync must not wipe rosters enriched by the background job. */
async function mergeSyncRowsWithExistingLineups(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  incoming: ReturnType<typeof rowFromEvent>[],
) {
  const ids = incoming.map((row) => row.id_event);
  if (ids.length === 0) return incoming;

  const { data } = await admin
    .from("sportsdb_fixtures")
    .select("id_event, lineup, slug, raw")
    .in("id_event", ids);

  const prevById = new Map(
    (data ?? []).map((row) => [row.id_event as string, row as Record<string, unknown>]),
  );

  return incoming.map((row) => {
    const prev = prevById.get(row.id_event);
    if (!prev) return row;
    const prevRaw = (prev.raw as Record<string, unknown> | null) ?? {};
    const prevLineup =
      (prev.lineup as StoredLineupPlayer[] | null | undefined) ??
      (prevRaw.lineup as StoredLineupPlayer[] | undefined) ??
      [];
    if (prevLineup.length === 0) return row;

    const nextRaw = {
      ...(row.raw as Record<string, unknown>),
      lineup: prevLineup,
      sideline_slug:
        (prevRaw.sideline_slug as string | undefined) ??
        ((row.raw as Record<string, unknown>).sideline_slug as string | undefined),
      idHomeTeam:
        (prevRaw.idHomeTeam as string | undefined) ??
        ((row.raw as Record<string, unknown>).idHomeTeam as string | undefined),
      idAwayTeam:
        (prevRaw.idAwayTeam as string | undefined) ??
        ((row.raw as Record<string, unknown>).idAwayTeam as string | undefined),
    };
    return {
      ...row,
      raw: nextRaw,
      ...(typeof prev.slug === "string" ? { slug: prev.slug } : {}),
      lineup: prevLineup,
    };
  });
}

/** Background roster fetch for matches that need lineups (run on a schedule). */
export async function enrichFixturesBatch(force = false) {
  const admin = createServiceClient();
  if (!admin) {
    return { ok: false as const, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  if (!force && Date.now() - lastEnrichFinished < ENRICH_SYNC_MS) {
    return { ok: true as const, enriched: 0, skipped: true as const };
  }

  if (getDegradedMode().cacheOnly) {
    return { ok: true as const, enriched: 0, skipped: true as const };
  }

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(400)
      .then((r) => ({ data: r.data, error: r.error })),
  );

  const candidates: LiveFixtureRow[] = [];
  for (const league of SIDELINE_LEAGUES) {
    const slice = data
      .map((row) => hydrateFixtureRow(row))
      .filter((row) => isLiveLeagueRow(row))
      .filter(
        (row) =>
          row.league_id === league.tsdbId ||
          leagueMatchesRow(row)?.tsdbId === league.tsdbId,
      )
      .filter(shouldEnrichFixtureRow)
      .sort((a, b) => {
        const sr =
          statusRank(fixtureRowStatus(a)) - statusRank(fixtureRowStatus(b));
        if (sr !== 0) return sr;
        return (b.date_event ?? "").localeCompare(a.date_event ?? "");
      })
      .slice(0, ENRICH_PER_LEAGUE);
    candidates.push(...slice);
  }

  let enriched = 0;
  for (const row of candidates) {
    if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) break;
    const outcomes = await mapWithConcurrency([row], ENRICH_CONCURRENCY, (item) =>
      applyLineupEnrichToRow(admin, item),
    );
    enriched += outcomes.filter(Boolean).length;
  }

  lastEnrichFinished = Date.now();
  return { ok: true as const, enriched, candidates: candidates.length };
}

/** @deprecated Use syncFixturesFast — kept for imports; no inline enrich. */
export async function syncSportsDbFixtures(force = false) {
  return syncFixturesFast(force);
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
  let lastError: string | null = null;
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    const res = await run(select);
    if (!res.error && res.data) {
      noteSupabaseHealthy();
      return res.data as Record<string, unknown>[];
    }
    if (res.error?.message) lastError = res.error.message;
  }
  if (
    lastError &&
    !isBenignSupabaseSchemaError(lastError)
  ) {
    markSupabaseUnavailable();
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
      .limit(Math.max(limit * 16, 160))
      .then((r) => ({ data: r.data, error: r.error })),
  );
  if (!data.length) return [];
  const filtered = data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => isLiveLeagueRow(row))
    .filter((row) => isVisibleFixtureRow(row))
    .filter((row) => {
      if (!leagueFilter) return true;
      return (
        row.league_id === leagueFilter.tsdbId ||
        leagueMatchesRow(row)?.tsdbId === leagueFilter.tsdbId
      );
    });
  filtered.sort((a, b) => {
    const sr = statusRank(fixtureRowStatus(a)) - statusRank(fixtureRowStatus(b));
    if (sr !== 0) return sr;
    if (fixtureRowStatus(a) === "ended") {
      return (b.date_event ?? "").localeCompare(a.date_event ?? "");
    }
    return (a.date_event ?? "").localeCompare(b.date_event ?? "");
  });
  return filtered.slice(0, limit);
}

export async function listLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit = 12,
  leagueSlug?: string,
): Promise<MatchEvent[]> {
  const rows = await listFixtures(sports, Math.max(limit * 4, 48), leagueSlug);
  const events = rows
    .map((r) => fixtureRowToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e))
    .filter((e) => isVisibleMatchStatus(e.status, e.startAt));
  events.sort((a, b) => {
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    if (a.status === "ended") return b.startAt.localeCompare(a.startAt);
    return a.startAt.localeCompare(b.startAt);
  });
  // Stored badge URLs are already copied onto the row. Looking the rest up
  // here keeps the list response open until TheSportsDB answers.
  return events.slice(0, limit);
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
      noteSupabaseHealthy();
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
    return withTeamLogos(fixtureRowToMatchEvent(row));
  }
  let row = hydrateFixtureRow(rowData as Record<string, unknown>);
  if (!isLiveLeagueRow(row) || !shouldRetainFixtureRow(row)) return null;

  if (
    !rowHasLineup(row) &&
    isVisibleFixtureRow(row) &&
    !getDegradedMode().cacheOnly &&
    upstreamAllows("thesportsdb", thesportsdbBudgets())
  ) {
    const ev = row.raw as unknown as TsdbEvent;
    const sport = row.sport as "nba" | "soccer";
    try {
      const lineup = await resolvePlayersForEvent(
        { ...ev, idEvent: row.id_event },
        sport,
      );
      if (lineup.length > 0) {
        row = {
          ...row,
          lineup,
          raw: {
            ...(row.raw as Record<string, unknown>),
            lineup,
          },
        };
        if (admin) {
          void applyLineupEnrichToRow(admin, row);
        }
      } else if (admin) {
        await applyLineupEnrichToRow(admin, row);
        const refreshed = await admin
          .from("sportsdb_fixtures")
          .select(FIXTURE_SELECT_WITH_TEAM_COLS)
          .eq("slug", slug)
          .maybeSingle();
        if (refreshed.data) {
          row = hydrateFixtureRow(refreshed.data as unknown as Record<string, unknown>);
        }
      }
    } catch {
      /* keep score-only row */
    }
  }

  const event = fixtureRowToMatchEvent(row);
  if (!event) return null;
  if (event.homeTeamLogoUrl && event.awayTeamLogoUrl) return event;
  return withTeamLogos(event);
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
    .filter((row) => isVisibleFixtureRow(row))
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
    const event = fixtureRowToMatchEvent(row);
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
      const event = fixtureRowToMatchEvent(row);
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
  leagueSlug?: string;
  leagueId?: string;
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
    const rowLeague = leagueMatchesRow(hydrated);
    if (leagueId) {
      const want = getLeagueByTsdbId(leagueId);
      if (!want || !rowLeague || rowLeague.tsdbId !== want.tsdbId) continue;
    }

    const candidates: { id?: string | null; name?: string | null }[] = [
      { id: hydrated.id_home_team, name: hydrated.str_home_team },
      { id: hydrated.id_away_team, name: hydrated.str_away_team },
    ];
    for (const c of candidates) {
      if (!c.id || !c.name) continue;
      if (!c.name.toLowerCase().includes(q)) continue;
      if (byId.has(c.id)) continue;
      byId.set(
        c.id,
        enrichTeamSearchHit(
          {
            id: c.id,
            name: c.name,
            league: hydrated.str_league ?? undefined,
            sport: hydrated.sport as "nba" | "soccer",
          },
          hydrated.league_id,
        ),
      );
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
    .filter((row) => isVisibleFixtureRow(row))
    .filter((row) => {
      if (row.id_home_team === teamId || row.id_away_team === teamId) return true;
      if (!nameLower) return false;
      return (
        row.str_home_team?.toLowerCase() === nameLower ||
        row.str_away_team?.toLowerCase() === nameLower
      );
    })
    .slice(0, limit);

  const events = rows
    .map((r) => fixtureRowToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e))
    .filter((e) => isVisibleMatchStatus(e.status, e.startAt))
    .sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;
      return b.startAt.localeCompare(a.startAt);
    });
  return events;
}

export async function refreshFixtureFromTsdb(idEvent: string): Promise<MatchEvent | null> {
  if (getDegradedMode().cacheOnly) {
    return getLiveMatchById(idEvent);
  }
  let ev: TsdbEvent | null = null;
  try {
    ev = await withUpstreamTimeout(
      fetchEventById(idEvent),
      UPSTREAM_TIMEOUT_MS,
      markTsdbUnavailable,
    );
  } catch {
    markTsdbUnavailable();
    return getLiveMatchById(idEvent);
  }
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
        int_home_score: parseTsdbScore(ev.intHomeScore),
        int_away_score: parseTsdbScore(ev.intAwayScore),
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

/** Pull rosters for in-progress fixtures missing a lineup (list/detail live polls). */
export async function enrichLiveFixturesMissingLineup(maxItems = 5) {
  const admin = createServiceClient();
  if (!admin || getDegradedMode().cacheOnly) return 0;
  if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) return 0;

  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .in("sport", ["nba", "soccer"])
      .order("date_event", { ascending: false })
      .limit(120)
      .then((r) => ({ data: r.data, error: r.error })),
  );

  const liveRows = data
    .map((row) => hydrateFixtureRow(row))
    .filter((row) => {
      if (rowHasLineup(row)) return false;
      const mapped = fixtureRowToMatchEvent(row);
      return mapped?.status === "live";
    })
    .slice(0, maxItems);

  let enriched = 0;
  for (const row of liveRows) {
    if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) break;
    const ok = await applyLineupEnrichToRow(admin, row);
    if (ok) enriched += 1;
  }
  return enriched;
}

export async function refreshLiveFixturesFromTsdb(limit = 10) {
  if (getDegradedMode().cacheOnly) return;
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
    .filter((row) => {
      const event = fixtureRowToMatchEvent(row);
      return event?.status === "live";
    })
    .slice(0, limit)
    .map((r) => r.id_event);

  for (const id of liveIds) {
    if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) break;
    try {
      await refreshFixtureFromTsdb(id);
    } catch {
      /* one failure, or the daily budget is spent */
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
      return withTeamLogos(
        fixtureRowToMatchEvent(
          hydrateFixtureRow(res.data as unknown as Record<string, unknown>),
        ),
      );
    }
  }
  return null;
}
