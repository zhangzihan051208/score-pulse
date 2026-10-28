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
import type { MatchEvent } from "./types";

const LIVE_SYNC_MS = SCHEDULE_SYNC_MS;
const ENRICH_SYNC_MS = 4 * 60 * 1000;
const ENRICH_CONCURRENCY = 1;
/** Upcoming fixtures within this many days may get roster enrichment. */
const ENRICH_UPCOMING_DAYS = 3;
/** Recently ended fixtures within this many days may still get rosters. */
const ENRICH_ENDED_DAYS = 1;

function fixtureRowToMatchEvent(row: LiveFixtureRow): MatchEvent | null {
  const hasLineup = rowHasLineup(row);
  const event = fixtureToMatchEvent(row, { scoreOnly: !hasLineup });
  return event;
}
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
    byId.set(ev.idEvent, rowFromEvent(league.sport, league.tsdbId, ev));
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
      latest?.synced_at 
