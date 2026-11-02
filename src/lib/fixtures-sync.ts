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
import { revalidateTag, unstable_cache } from "next/cache";
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
import { applyKnownCrests, fillMissingTeamLogos } from "@/lib/team-badges";
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
  balanceFixturesByStatus,
  effectiveFixtureStatus,
  ENDED_DB_RETAIN_DAYS,
  ENDED_VISIBLE_DAYS,
  UPCOMING_VISIBLE_DAYS,
  isVisibleFixtureRow,
  isVisibleMatchStatus,
  shouldRetainFixtureRow,
} from "@/lib/fixture-retention";
import { alignEventToNow } from "@/lib/match-clock";
import { withSoccerTimelineStats } from "@/lib/soccer-timeline";
import type { MatchEvent } from "./types";

const LIVE_SYNC_MS = SCHEDULE_SYNC_MS;
const ENRICH_SYNC_MS = 4 * 60 * 1000;
const ENRICH_CONCURRENCY = 1;
/** Upcoming fixtures within this many days may get roster enrichment. */
const ENRICH_UPCOMING_DAYS = 5;
/** Recently ended fixtures within this many days may still get rosters. */
const ENRICH_ENDED_DAYS = 5;

function fixtureRowToMatchEvent(row: LiveFixtureRow): MatchEvent | null {
  const loaded = (row.lineup?.length ?? 0) > 0;
  const count = lineupCountOf(row);
  const event = fixtureToMatchEvent(row, { scoreOnly: !loaded });
  if (!event) return null;
  if (loaded) return { ...event, playerCount: count };
  if (count > 0) return { ...event, playerCount: count, lineupState: "ready" };
  return event;
}

function rowNeedsLineupEnrich(row: LiveFixtureRow): boolean {
  if (rowHasLineup(row)) return false;
  const seed = fixtureToMatchEvent(row, { scoreOnly: true });
  if (!seed) return shouldEnrichFixtureRow(row);
  const status = alignEventToNow(seed).status;
  if (status === "live") return true;
  if (status === "ended" || status === "upcoming") return shouldEnrichFixtureRow(row);
  return false;
}

async function enrichRowsLineups(
  rows: LiveFixtureRow[],
  maxItems: number,
): Promise<LiveFixtureRow[]> {
  const admin = createServiceClient();
  if (!admin || getDegradedMode().cacheOnly) return rows;

  const byId = new Map(rows.map((r) => [r.id_event, r]));
  const rank = (row: LiveFixtureRow) => {
    const status = effectiveFixtureStatus(row);
    if (status === "live") return 0;
    if (status === "ended") return 1;
    return 2;
  };
  const candidates = rows
    .filter(rowNeedsLineupEnrich)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, maxItems);

  await mapWithConcurrency(candidates, 4, async (row) => {
    const ev = row.raw as unknown as TsdbEvent;
    const sport = row.sport as "nba" | "soccer";
    if (sport !== "nba" && sport !== "soccer") return;
    try {
      const lineup = await resolvePlayersForEvent(
        {
          ...ev,
          idEvent: row.id_event,
          idHomeTeam: row.id_home_team ?? ev.idHomeTeam,
          idAwayTeam: row.id_away_team ?? ev.idAwayTeam,
        },
        sport,
      );
      if (lineup.length === 0) return;
      const updated: LiveFixtureRow = {
        ...row,
        lineup,
        raw: {
          ...(row.raw as Record<string, unknown>),
          lineup,
        },
      };
      byId.set(row.id_event, updated);
      void applyLineupEnrichToRow(admin, updated);
    } catch {
      /* try next fixture */
    }
  });

  return rows.map((r) => byId.get(r.id_event) ?? r);
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

/** Badges and a roster count. The player rows live only in the lineup column. */
function slimFixtureRaw(
  ev: Pick<TsdbEvent, "idHomeTeam" | "idAwayTeam" | "strHomeTeamBadge" | "strAwayTeamBadge">,
  extras: { slug: string; lineup?: StoredLineupPlayer[] },
): Record<string, unknown> {
  return {
    sideline_slug: extras.slug,
    idHomeTeam: ev.idHomeTeam,
    idAwayTeam: ev.idAwayTeam,
    strHomeTeamBadge: ev.strHomeTeamBadge,
    strAwayTeamBadge: ev.strAwayTeamBadge,
    lineup_count: extras.lineup?.length ?? 0,
  };
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
    slug,
    raw: slimFixtureRaw(ev, { slug }),
    synced_at: new Date().toISOString(),
  };
}

function lineupCountOf(row: LiveFixtureRow): number {
  if (row.lineup && row.lineup.length > 0) return row.lineup.length;
  const raw = row.raw as Record<string, unknown> | null | undefined;
  const counted = Number(raw?.lineup_count);
  if (Number.isFinite(counted) && counted > 0) return counted;
  const embedded = raw?.lineup;
  if (Array.isArray(embedded)) return embedded.length;
  return 0;
}

function rowHasLineup(row: LiveFixtureRow): boolean {
  return lineupCountOf(row) > 0;
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

/** Roster payloads include biographies and social links the boards never read. */
function slimStoredPlayer(player: TsdbLineupPlayer): StoredLineupPlayer {
  const slim: StoredLineupPlayer = {
    idPlayer: player.idPlayer,
    strPlayer: player.strPlayer,
  };
  if (player.idEvent) slim.idEvent = player.idEvent;
  if (player.strTeam) slim.strTeam = player.strTeam;
  if (player.idTeam) slim.idTeam = player.idTeam;
  if (player.strPosition) slim.strPosition = player.strPosition;
  if (player.strHome) slim.strHome = player.strHome;
  if (player.strSubstitute) slim.strSubstitute = player.strSubstitute;
  if (player.intSquadNumber) slim.intSquadNumber = player.intSquadNumber;
  if (player.strNumber) slim.strNumber = player.strNumber;
  if (player.strThumb) slim.strThumb = player.strThumb;
  if (player.strCutout) slim.strCutout = player.strCutout;
  return slim;
}

function enrichPlayer(
  base: StoredLineupPlayer,
  extra: TsdbLineupPlayer,
): StoredLineupPlayer {
  return slimStoredPlayer({
    ...base,
    strPosition: base.strPosition?.trim() ? base.strPosition : extra.strPosition,
    intSquadNumber: base.intSquadNumber ?? extra.intSquadNumber,
    strNumber: base.strNumber ?? extra.strNumber,
    strThumb: base.strThumb ?? extra.strThumb,
    strCutout: base.strCutout ?? extra.strCutout,
  });
}

function mergePlayers(
  lineup: TsdbLineupPlayer[],
  rosters: TsdbLineupPlayer[][],
): StoredLineupPlayer[] {
  const byId = new Map<string, StoredLineupPlayer>();
  for (const p of lineup) {
    if (p.idPlayer && p.strPlayer) byId.set(p.idPlayer, slimStoredPlayer(p));
  }
  for (const list of rosters) {
    for (const p of list) {
      if (!p.idPlayer || !p.strPlayer) continue;
      const existing = byId.get(p.idPlayer);
      if (existing) {
        byId.set(p.idPlayer, enrichPlayer(existing, p));
      } else {
        byId.set(
          p.idPlayer,
          slimStoredPlayer({
            ...p,
            strSubstitute: p.strSubstitute ?? "Yes",
          }),
        );
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
  const status = effectiveFixtureStatus(row);
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

async function fetchLeagueBucket(
  league: LeagueConfig,
): Promise<{ league: LeagueConfig; events: TsdbEvent[] } | null> {
  if (league.sport !== "nba" && league.sport !== "soccer") return null;
  if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) return null;
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
    return { league, events: [...next, ...past, ...last] };
  } catch (error) {
    if (error instanceof UpstreamBudgetError) return null;
    return null;
  }
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
  const lineupOpts = { lineupBudget: true as const };
  let lineup = await fetchLineup(ev.idEvent, lineupOpts);
  if (lineup.length >= 11) return lineup.map(slimStoredPlayer);

  let homeId = ev.idHomeTeam;
  let awayId = ev.idAwayTeam;
  if (!homeId || !awayId) {
    const detail = await fetchEventById(ev.idEvent, lineupOpts);
    homeId = detail?.idHomeTeam ?? homeId;
    awayId = detail?.idAwayTeam ?? awayId;
  }

  if (homeId && awayId) {
    const [homeRoster, awayRoster] = await Promise.all([
      fetchTeamRoster(homeId, lineupOpts),
      fetchTeamRoster(awayId, lineupOpts),
    ]);
    lineup = mergePlayers(lineup, [homeRoster, awayRoster]);
  }
  return lineup.map(slimStoredPlayer);
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
    const prevRaw = (row.raw as Record<string, unknown> | undefined) ?? {};
    const enrichedRaw = slimFixtureRaw(
      {
        idHomeTeam: (ev.idHomeTeam ?? prevRaw.idHomeTeam) as string | undefined,
        idAwayTeam: (ev.idAwayTeam ?? prevRaw.idAwayTeam) as string | undefined,
        strHomeTeamBadge: prevRaw.strHomeTeamBadge as string | undefined,
        strAwayTeamBadge: prevRaw.strAwayTeamBadge as string | undefined,
      },
      {
        slug:
          (prevRaw.sideline_slug as string | undefined) ??
          fixtureSlug(
            row.str_home_team ?? "Home",
            row.str_away_team ?? "Away",
            row.date_event,
          ),
        lineup,
      },
    );
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

/** Fast path: schedules/scores only — no per-match roster calls. Writes each league as it finishes. */
export async function syncFixturesFast(
  force = false,
  sports?: ("nba" | "soccer")[],
) {
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
      const pruned = await pruneExpiredFixturesFromDb(admin);
      return { ok: true as const, count: 0, skipped: true as const, pruned };
    }
  }

  if (getDegradedMode().cacheOnly) {
    return { ok: true as const, count: 0, skipped: true as const };
  }

  const leagues = SIDELINE_LEAGUES.filter(
    (league) =>
      (league.sport === "nba" || league.sport === "soccer") &&
      (!sports || sports.includes(league.sport)),
  );
  let count = 0;
  let lastError: string | undefined;
  for (const league of leagues) {
    const bucket = await fetchLeagueBucket(league);
    if (!bucket || bucket.events.length === 0) continue;
    const rows = mergeLeagueBucketsIntoRows([bucket]);
    if (rows.length === 0) continue;
    const writeError = await writeFixtureRows(admin, rows);
    if (writeError) {
      lastError = writeError;
      continue;
    }
    count += rows.length;
  }
  if (count === 0 && lastError) {
    return { ok: false as const, error: lastError };
  }

  const pruned = await pruneExpiredFixturesFromDb(admin);

  revalidateTag("fixtures", "max");
  return { ok: true as const, count, pruned };
}

function retentionDateBounds(now = Date.now()) {
  const day = 86_400_000;
  return {
    since: new Date(now - ENDED_DB_RETAIN_DAYS * day).toISOString().slice(0, 10),
    until: new Date(now + UPCOMING_VISIBLE_DAYS * day).toISOString().slice(0, 10),
  };
}

function isProviderMatchId(eventId: string) {
  return /^\d+$/.test(eventId);
}

async function deleteByEventIds(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  table: "comments" | "ratings" | "sportsdb_fixtures",
  ids: string[],
) {
  const column = table === "sportsdb_fixtures" ? "id_event" : "event_id";
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { error, count } = await admin
      .from(table)
      .delete({ count: "exact" })
      .in(column, chunk);
    if (error) break;
    deleted += count ?? chunk.length;
  }
  return deleted;
}

/** Drop matches outside the 5-day window, their ratings and comments, and unused player fields. */
export async function pruneExpiredFixturesFromDb(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
) {
  const { since, until } = retentionDateBounds();
  const expired: string[] = [];
  for (let from = 0; from < 20_000; from += 500) {
    const { data, error } = await admin
      .from("sportsdb_fixtures")
      .select("id_event")
      .or(`date_event.is.null,date_event.lt.${since},date_event.gt.${until}`)
      .order("id_event")
      .range(from, from + 499);
    if (error || !data?.length) break;
    for (const row of data) expired.push(row.id_event as string);
    if (data.length < 500) break;
  }

  if (expired.length > 0) {
    await deleteByEventIds(admin, "comments", expired);
    await deleteByEventIds(admin, "ratings", expired);
    await deleteByEventIds(admin, "sportsdb_fixtures", expired);
  }

  const kept = new Set<string>();
  for (let from = 0; from < 20_000; from += 500) {
    const { data, error } = await admin
      .from("sportsdb_fixtures")
      .select("id_event")
      .order("id_event")
      .range(from, from + 499);
    if (error || !data?.length) break;
    for (const row of data) kept.add(row.id_event as string);
    if (data.length < 500) break;
  }

  if (kept.size > 0) {
    const numericMatch = "0123456789"
      .split("")
      .map((digit) => `event_id.like.${digit}*`)
      .join(",");
    const keepList = `(${[...kept].join(",")})`;
    for (const table of ["ratings", "comments"] as const) {
      const orphans: string[] = [];
      const seen = new Set<string>();
      for (let page = 0; page < 20; page += 1) {
        const { data, error } = await admin
          .from(table)
          .select("event_id")
          .or(numericMatch)
          .not("event_id", "in", keepList)
          .limit(200);
        if (error || !data?.length) break;
        for (const row of data) {
          const eventId = row.event_id as string;
          if (!isProviderMatchId(eventId) || kept.has(eventId) || seen.has(eventId)) continue;
          seen.add(eventId);
          orphans.push(eventId);
        }
        if (orphans.length > 0) {
          await deleteByEventIds(admin, table, orphans);
          orphans.length = 0;
        }
        if (data.length < 200) break;
      }
    }
  }

  await stripEmbeddedLineups(admin);

  return expired.length;
}

/** Score updates must not rewrite stored rosters. New matches still get a small raw payload. */
async function writeFixtureRows(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  rows: ReturnType<typeof rowFromEvent>[],
) {
  const ids = rows.map((row) => row.id_event);
  const { data, error } = await admin
    .from("sportsdb_fixtures")
    .select("id_event")
    .in("id_event", ids);
  const scoreOnly = (row: ReturnType<typeof rowFromEvent>) => {
    const { raw, ...rest } = row;
    return rest;
  };
  if (error) {
    const { error: fallback } = await admin
      .from("sportsdb_fixtures")
      .upsert(rows.map(scoreOnly), { onConflict: "id_event" });
    return fallback?.message;
  }
  const existing = new Set((data ?? []).map((row) => row.id_event as string));
  const inserts = rows
    .filter((row) => !existing.has(row.id_event))
    .map((row) => ({ ...scoreOnly(row), raw: row.raw }));
  const updates = rows.filter((row) => existing.has(row.id_event)).map(scoreOnly);
  if (inserts.length > 0) {
    const { error: insertError } = await admin
      .from("sportsdb_fixtures")
      .upsert(inserts, { onConflict: "id_event" });
    if (insertError) return insertError.message;
  }
  for (let i = 0; i < updates.length; i += 40) {
    const { error: updateError } = await admin
      .from("sportsdb_fixtures")
      .upsert(updates.slice(i, i + 40), { onConflict: "id_event" });
    if (updateError) return updateError.message;
  }
  return undefined;
}

/** Drop roster arrays that were copied into raw. One probe, then only the rows that still have a copy. */
async function stripEmbeddedLineups(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
) {
  const probe = await admin
    .from("sportsdb_fixtures")
    .select("id_event")
    .not("raw->lineup", "is", null)
    .limit(1);
  if (probe.error || !probe.data?.length) return;

  for (let page = 0; page < 40; page += 1) {
    const { data, error } = await admin
      .from("sportsdb_fixtures")
      .select("id_event, slug, lineup, raw, id_home_team, id_away_team, str_home_team, str_away_team, date_event")
      .not("raw->lineup", "is", null)
      .limit(40);
    if (error || !data?.length) break;
    for (const row of data) {
      const raw = (row.raw as Record<string, unknown> | null) ?? {};
      const lineup = (
        (row.lineup as StoredLineupPlayer[] | null) ??
        (raw.lineup as StoredLineupPlayer[] | undefined) ??
        []
      ).map((player) => slimStoredPlayer(player));
      const slug =
        (row.slug as string | null) ??
        (raw.sideline_slug as string | undefined) ??
        fixtureSlug(
          row.str_home_team ?? "Home",
          row.str_away_team ?? "Away",
          row.date_event as string | null,
        );
      await admin
        .from("sportsdb_fixtures")
        .update({
          lineup,
          raw: slimFixtureRaw(
            {
              idHomeTeam: (raw.idHomeTeam as string | undefined) ?? (row.id_home_team as string | undefined),
              idAwayTeam: (raw.idAwayTeam as string | undefined) ?? (row.id_away_team as string | undefined),
              strHomeTeamBadge: raw.strHomeTeamBadge as string | undefined,
              strAwayTeamBadge: raw.strAwayTeamBadge as string | undefined,
            },
            { slug, lineup },
          ),
        })
        .eq("id_event", row.id_event as string);
    }
    if (data.length < 40) break;
  }
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

function isHardSupabaseFailure(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("abort") ||
    m.includes("fetch failed") ||
    m.includes("network") ||
    m.includes("econnreset") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("504") ||
    m.includes("upstream")
  );
}

async function fetchFixtureRows(
  run: (select: string) => PromiseLike<FixtureQueryResult>,
): Promise<Record<string, unknown>[]> {
  let lastError: string | null = null;
  for (const select of [
    FIXTURE_SELECT_WITH_TEAM_COLS,
    FIXTURE_SELECT_WITH_LEAGUE,
    FIXTURE_SELECT_CORE,
  ]) {
    try {
      const res = await withTimeout(Promise.resolve(run(select)), 2_000, {
        data: null,
        error: { message: "upstream_timeout" },
      });
      if (!res.error && res.data) {
        noteSupabaseHealthy();
        return res.data as Record<string, unknown>[];
      }
      if (res.error?.message) lastError = res.error.message;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "upstream_timeout";
    }
    if (lastError && isHardSupabaseFailure(lastError)) break;
  }
  if (lastError && !isBenignSupabaseSchemaError(lastError)) {
    markSupabaseUnavailable();
  }
  return [];
}

/** One scoreboard read for every league page. Rosters stay on a slower cache. */
async function queryFixtureWindow(): Promise<LiveFixtureRow[]> {
  const admin = createServiceClient();
  if (!admin) return [];
  const since = new Date(Date.now() - ENDED_VISIBLE_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const until = new Date(Date.now() + UPCOMING_VISIBLE_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const chunks = await Promise.all(
    (["nba", "soccer"] as const).map((sport) =>
      fetchFixtureRows((select) =>
        admin
          .from("sportsdb_fixtures")
          .select(select)
          .eq("sport", sport)
          .gte("date_event", since)
          .lte("date_event", until)
          .order("date_event", { ascending: false })
          .limit(180)
          .then((r) => ({ data: r.data, error: r.error })),
      ),
    ),
  );
  return chunks.flat().map((row) => hydrateFixtureRow(row));
}

const cachedFixtureWindow = unstable_cache(queryFixtureWindow, ["fixture-window-v2"], {
  revalidate: 180,
  tags: ["fixtures"],
});

async function queryLineupRecord(): Promise<Record<string, StoredLineupPlayer[]>> {
  const admin = createServiceClient();
  const out: Record<string, StoredLineupPlayer[]> = {};
  if (!admin) return out;
  for (let from = 0; from < 2_000; from += 200) {
    const { data, error } = await admin
      .from("sportsdb_fixtures")
      .select("id_event,lineup")
      .order("id_event")
      .range(from, from + 199);
    if (error || !data?.length) break;
    for (const row of data) {
      const lineup = row.lineup as StoredLineupPlayer[] | null;
      if (Array.isArray(lineup) && lineup.length > 0) out[row.id_event as string] = lineup;
    }
    if (data.length < 200) break;
  }
  return out;
}

const cachedLineupRecord = unstable_cache(queryLineupRecord, ["fixture-lineups-v2"], {
  revalidate: 2 * 60 * 60,
  tags: ["fixture-lineups"],
});

async function attachCachedLineups(rows: LiveFixtureRow[]) {
  if (rows.length === 0 || rows.every((row) => (row.lineup?.length ?? 0) > 0)) return rows;
  let record: Record<string, StoredLineupPlayer[]> = {};
  try {
    record = await cachedLineupRecord();
  } catch {
    return rows;
  }
  return rows.map((row) => {
    if ((row.lineup?.length ?? 0) > 0) return row;
    const lineup = record[row.id_event];
    return lineup?.length ? { ...row, lineup } : row;
  });
}

async function loadFixturesForSports(
  sports: string[],
  limit: number,
  leagueSlug?: string,
) {
  const windowRows = await cachedFixtureWindow();
  const visible = selectVisibleFixtures(windowRows, sports, limit, leagueSlug);
  return attachCachedLineups(visible);
}

function selectVisibleFixtures(
  rows: FixtureRow[],
  sports: string[],
  limit: number,
  leagueSlug?: string,
): FixtureRow[] {
  const leagueFilter = leagueSlug ? getLeagueBySlug(leagueSlug) : undefined;
  const filtered = rows
    .filter((row) => sports.includes(row.sport))
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
    const sr =
      statusRank(effectiveFixtureStatus(a)) - statusRank(effectiveFixtureStatus(b));
    if (sr !== 0) return sr;
    if (effectiveFixtureStatus(a) === "ended") {
      return (b.date_event ?? "").localeCompare(a.date_event ?? "");
    }
    return (a.date_event ?? "").localeCompare(b.date_event ?? "");
  });

  if (sports.length <= 1) return balanceFixturesByStatus(filtered, limit);

  const share = Math.ceil(limit / sports.length);
  const picked: FixtureRow[] = [];
  for (const sport of sports) {
    const mine = filtered.filter((row) => row.sport === sport);
    picked.push(...balanceFixturesByStatus(mine, share));
  }
  return picked.slice(0, limit);
}

let providerFixtureCache: { at: number; rows: FixtureRow[] } | null = null;
let providerFixtureInflight: Promise<FixtureRow[]> | null = null;
const PROVIDER_FIXTURE_TTL_MS = 30_000;

/** Read the 5-day window from TheSportsDB when the database cannot answer. */
async function loadProviderFixtureRows(): Promise<FixtureRow[]> {
  if (providerFixtureCache && Date.now() - providerFixtureCache.at < PROVIDER_FIXTURE_TTL_MS) {
    return providerFixtureCache.rows;
  }
  if (providerFixtureInflight) return providerFixtureInflight;
  providerFixtureInflight = (async () => {
    try {
      const leagues = SIDELINE_LEAGUES.filter(
        (league) => league.sport === "nba" || league.sport === "soccer",
      );
      const buckets = await mapWithConcurrency(leagues, 4, (league) => fetchLeagueBucket(league));
      const merged = mergeLeagueBucketsIntoRows(
        buckets.filter((bucket): bucket is NonNullable<typeof bucket> => Boolean(bucket)),
      );
      const rows = merged.map((row) =>
        hydrateFixtureRow(row as unknown as Record<string, unknown>),
      );
      providerFixtureCache = { at: Date.now(), rows };
      return rows;
    } finally {
      providerFixtureInflight = null;
    }
  })();
  return providerFixtureInflight;
}

async function fixturesFromProvider(sports: string[], limit: number, leagueSlug?: string) {
  const rows = await loadProviderFixtureRows();
  return selectVisibleFixtures(rows, sports, limit, leagueSlug);
}

function withTimeout<T>(work: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(work).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export async function listFixtures(
  sports: string[],
  limit = 12,
  leagueSlug?: string,
) {
  const rows = getDegradedMode().cacheOnly
    ? []
    : await loadFixturesForSports(sports, limit, leagueSlug);
  const covered =
    rows.length > 0 && sports.every((sport) => rows.some((row) => row.sport === sport));
  if (covered) return rows;

  if (!getDegradedMode().cacheOnly) {
    const wanted = sports.filter(
      (sport): sport is "nba" | "soccer" => sport === "nba" || sport === "soccer",
    );
    void syncFixturesFast(true, wanted).catch(() => {});
  }

  const live = await fixturesFromProvider(sports, limit, leagueSlug);
  return live.length > 0 ? live : rows;
}

export async function listLiveMatchEvents(
  sports: ("nba" | "soccer")[],
  limit = 12,
  leagueSlug?: string,
  opts?: { enrichLineups?: boolean; enrichMax?: number },
): Promise<MatchEvent[]> {
  let rows = await listFixtures(sports, Math.max(limit, 24), leagueSlug);
  if (opts?.enrichLineups !== false) {
    rows = await withTimeout(
      enrichRowsLineups(rows, opts?.enrichMax ?? Math.min(limit, 8)),
      5_000,
      rows,
    );
  }
  let events = rows
    .map((r) => fixtureRowToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e))
    .filter((e) => isVisibleMatchStatus(e.status, e.startAt));
  events.sort((a, b) => {
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    if (a.status === "ended") return b.startAt.localeCompare(a.startAt);
    return a.startAt.localeCompare(b.startAt);
  });
  events = applyKnownCrests(events.slice(0, limit));
  events = await withTimeout(fillMissingTeamLogos(events), 4_000, events);
  return events;
}

export async function getLiveMatchBySlug(slug: string) {
  const admin = createServiceClient();

  let rowData: Record<string, unknown> | null = null;
  if (admin && !getDegradedMode().cacheOnly) {
    for (const select of [
      `${FIXTURE_SELECT_WITH_TEAM_COLS},lineup`,
      FIXTURE_SELECT_WITH_TEAM_COLS,
      FIXTURE_SELECT_WITH_LEAGUE,
      FIXTURE_SELECT_CORE,
    ]) {
      const res = await withTimeout<{
        data: Record<string, unknown> | null;
        error: { message: string } | null;
      }>(
        admin.from("sportsdb_fixtures").select(select).eq("slug", slug).maybeSingle(),
        2_000,
        { data: null, error: { message: "upstream_timeout" } },
      );
      if (!res.error && res.data) {
        noteSupabaseHealthy();
        rowData = res.data as unknown as Record<string, unknown>;
        break;
      }
      if (res.error?.message && isHardSupabaseFailure(res.error.message)) {
        markSupabaseUnavailable();
        break;
      }
    }
  }
  if (!rowData) {
    const provided = (await loadProviderFixtureRows()).find((row) => row.slug === slug);
    if (!provided) return null;
    rowData = provided as unknown as Record<string, unknown>;
  }
  let row = hydrateFixtureRow(rowData as Record<string, unknown>);
  if (!isLiveLeagueRow(row) || !shouldRetainFixtureRow(row)) return null;

  if (!rowHasLineup(row) && isVisibleFixtureRow(row)) {
    const ev = row.raw as unknown as TsdbEvent;
    const sport = row.sport as "nba" | "soccer";
    try {
      const lineup = await withTimeout(
        resolvePlayersForEvent(
          {
            ...ev,
            idEvent: row.id_event,
            idHomeTeam: row.id_home_team ?? ev.idHomeTeam,
            idAwayTeam: row.id_away_team ?? ev.idAwayTeam,
          },
          sport,
        ),
        6_000,
        [] as StoredLineupPlayer[],
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
        if (admin && !getDegradedMode().cacheOnly) {
          void applyLineupEnrichToRow(admin, row);
        }
      } else if (admin && !getDegradedMode().cacheOnly) {
        await applyLineupEnrichToRow(admin, row);
        const refreshed = await withTimeout<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>(
          admin
            .from("sportsdb_fixtures")
            .select(FIXTURE_SELECT_WITH_TEAM_COLS)
            .eq("slug", slug)
            .maybeSingle(),
          2_000,
          { data: null, error: { message: "upstream_timeout" } },
        );
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
  const withLineup =
    event.performances.length > 0
      ? { ...event, lineupState: "ready" as const }
      : event.status === "upcoming"
        ? event
        : { ...event, lineupState: "missing" as const };
  const stamped = await withTimeout(
    withSoccerTimelineStats(withLineup),
    4_500,
    withLineup,
  );
  if (stamped.homeTeamLogoUrl && stamped.awayTeamLogoUrl) return stamped;
  return withTeamLogos(stamped);
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
  const rows = (
    await attachCachedLineups(
      rawRows.map((row) => hydrateFixtureRow(row as Record<string, unknown>)),
    )
  )
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

function teamRowMatches(
  row: LiveFixtureRow,
  teamId: string,
  nameLower?: string,
): boolean {
  if (row.id_home_team === teamId || row.id_away_team === teamId) return true;
  if (!nameLower) return false;
  return (
    row.str_home_team?.toLowerCase() === nameLower ||
    row.str_away_team?.toLowerCase() === nameLower
  );
}

/** Next kickoffs for push reminders — future dates first. */
export async function listUpcomingFixturesForTeam(
  teamId: string,
  sport: "nba" | "soccer",
  teamName?: string,
  limit = 20,
): Promise<MatchEvent[]> {
  const admin = createServiceClient();
  if (!admin) return [];

  const today = new Date().toISOString().slice(0, 10);
  const nameLower = teamName?.toLowerCase();
  const data = await fetchFixtureRows((select) =>
    admin
      .from("sportsdb_fixtures")
      .select(select)
      .eq("sport", sport)
      .gte("date_event", today)
      .order("date_event", { ascending: true })
      .order("str_time", { ascending: true })
      .limit(400)
      .then((r) => ({ data: r.data, error: r.error })),
  );

  const now = Date.now();
  const events = data
    .map((row) => hydrateFixtureRow(row as Record<string, unknown>))
    .filter((row) => isTrackedFixture(row))
    .filter((row) => teamRowMatches(row, teamId, nameLower))
    .map((r) => fixtureRowToMatchEvent(r))
    .filter((e): e is MatchEvent => Boolean(e))
    .map((e) => alignEventToNow(e))
    .filter((e) => {
      const start = Date.parse(e.startAt);
      return Number.isFinite(start) && start > now && e.status !== "ended";
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, limit);

  return events;
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
    .filter((row) => teamRowMatches(row, teamId, nameLower))
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
    .filter((row) => rowNeedsLineupEnrich(row))
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
    `${FIXTURE_SELECT_WITH_TEAM_COLS},lineup`,
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
      const event = fixtureRowToMatchEvent(
        hydrateFixtureRow(res.data as unknown as Record<string, unknown>),
      );
      if (!event) return null;
      const stamped = await withTimeout(withSoccerTimelineStats(event), 4_500, event);
      return withTeamLogos(stamped);
    }
  }
  return null;
}
