import { sleep } from "@/lib/kashrock-cache";
import {
  ESPORTS_GAMES,
  getEsportsGame,
  type EsportsGameConfig,
  type EsportsGameSlug,
} from "@/lib/esports-games";
import { pandaMatchToEvent, esportsEventSlug } from "@/lib/esports-match";
import { kashRockEventSlug, kashRockMatchToEvent } from "@/lib/kashrock-match";
import { enrichMatchesWithTeamRosters, enrichMatchWithTeamRosters } from "@/lib/esports-rosters";
import {
  fetchKashRockMatchDetail,
  fetchKashRockMatches,
  isKashRockConfigured,
  kashRockMatchId,
} from "@/lib/kashrock";
import { mergeKrMatches } from "@/lib/kashrock-normalize";
import { enrichKashRockMatchesWithPlayerBoards } from "@/lib/kashrock-rosters";
import {
  fetchEsportsMatchById,
  fetchEsportsMatches,
  isPandaScoreConfigured,
} from "@/lib/pandascore";
import type { PsMatch } from "@/lib/pandascore";
import type { MatchEvent } from "@/lib/types";

export function isEsportsDataConfigured() {
  return isKashRockConfigured() || isPandaScoreConfigured();
}

export function esportsDataSource(): "kashrock" | "pandascore" | null {
  if (isKashRockConfigured()) return "kashrock";
  if (isPandaScoreConfigured()) return "pandascore";
  return null;
}

function rawStatusRank(status?: string): number {
  if (status === "running" || status === "current" || status === "live") return 0;
  if (status === "not_started") return 1;
  return 2;
}

function prioritizeRawMatches(matches: PsMatch[], cap: number): PsMatch[] {
  return [...matches]
    .sort((a, b) => {
      const sr = rawStatusRank(a.status) - rawStatusRank(b.status);
      if (sr !== 0) return sr;
      const ta = a.begin_at ?? a.scheduled_at ?? "";
      const tb = b.begin_at ?? b.scheduled_at ?? "";
      return tb.localeCompare(ta);
    })
    .slice(0, cap);
}

function sortKrMatches(matches: import("@/lib/kashrock").KrMatch[], cap: number) {
  return [...matches]
    .sort((a, b) => {
      const sr = rawStatusRank(a.status) - rawStatusRank(b.status);
      if (sr !== 0) return sr;
      return (b.event_time ?? "").localeCompare(a.event_time ?? "");
    })
    .slice(0, cap);
}

function sortEvents(list: MatchEvent[]) {
  const rank = { live: 0, upcoming: 1, ended: 2 } as const;
  return [...list].sort((a, b) => {
    const sr = rank[a.status] - rank[b.status];
    if (sr !== 0) return sr;
    return b.startAt.localeCompare(a.startAt);
  });
}

async function listFromKashRock(
  gameSlug: EsportsGameSlug | undefined,
  limit: number,
  enrichBoards = true,
): Promise<MatchEvent[]> {
  const games = gameSlug
    ? ESPORTS_GAMES.filter((g) => g.slug === gameSlug)
    : ESPORTS_GAMES;

  const perGameCap = gameSlug
    ? Math.max(limit, 24)
    : Math.max(Math.ceil(limit / games.length) + 8, 12);

  const buckets: MatchEvent[][] = [];
  const multiGame = !gameSlug && games.length > 1;
  for (let i = 0; i < games.length; i++) {
    const game = games[i]!;
    if (multiGame && i > 0) await sleep(350);
    const raw = await fetchKashRockMatches(game.slug, perGameCap + 8);
    const picked = sortKrMatches(raw, perGameCap);
    const enrichCap = gameSlug ? 8 : 2;
    const withBoards =
      enrichBoards && enrichCap > 0
        ? await enrichKashRockMatchesWithPlayerBoards(game.slug, picked, enrichCap)
        : picked;
    buckets.push(
      withBoards
        .map((m) => kashRockMatchToEvent(game, m))
        .filter((e): e is MatchEvent => Boolean(e)),
    );
  }
  return sortEvents(buckets.flat()).slice(0, limit);
}

async function listFromPandaScore(
  gameSlug: EsportsGameSlug | undefined,
  limit: number,
  includeRosters: boolean,
): Promise<MatchEvent[]> {
  const games = gameSlug
    ? ESPORTS_GAMES.filter((g) => g.slug === gameSlug)
    : ESPORTS_GAMES;

  const perGameCap = gameSlug
    ? Math.max(limit, 24)
    : Math.max(Math.ceil(limit / games.length) + 8, 16);

  const buckets: MatchEvent[][] = [];
  for (const game of games) {
    const raw = await fetchEsportsMatches(game.apiPrefix);
    const picked = prioritizeRawMatches(raw, perGameCap);
    const matches = includeRosters
      ? await enrichMatchesWithTeamRosters(picked, {
          apiPrefixFallback: game.apiPrefix,
          concurrency: 2,
        })
      : picked;
    buckets.push(
      matches
        .map((m) => pandaMatchToEvent(game, m))
        .filter((e): e is MatchEvent => Boolean(e)),
    );
  }
  return sortEvents(buckets.flat()).slice(0, limit);
}

export async function listEsportsMatchEvents(
  gameSlug?: EsportsGameSlug,
  limit = 32,
  options?: { includeRosters?: boolean; enrichKrBoards?: boolean },
): Promise<MatchEvent[]> {
  const { events } = await listEsportsMatchEventsWithSource(gameSlug, limit, options);
  return events;
}

export async function listEsportsMatchEventsWithSource(
  gameSlug?: EsportsGameSlug,
  limit = 32,
  options?: { includeRosters?: boolean; enrichKrBoards?: boolean },
): Promise<{ events: MatchEvent[]; source: "kashrock" | "pandascore" | null }> {
  if (!isEsportsDataConfigured()) return { events: [], source: null };

  if (isKashRockConfigured()) {
    const fromKr = await listFromKashRock(gameSlug, limit, options?.enrichKrBoards);
    if (fromKr.length > 0 || !isPandaScoreConfigured()) {
      return { events: fromKr, source: "kashrock" };
    }
  }

  const events = await listFromPandaScore(
    gameSlug,
    limit,
    options?.includeRosters ?? false,
  );
  return { events, source: isPandaScoreConfigured() ? "pandascore" : null };
}

async function resolveKashRockMatch(
  slug: string,
  game: EsportsGameConfig,
  tail: string,
): Promise<import("@/lib/kashrock").KrMatch | null> {
  const krId = kashRockMatchId(game.slug, tail);
  const list = await fetchKashRockMatches(game.slug, 100);
  const fromList =
    list.find((m) => kashRockEventSlug(game.slug, m) === slug) ??
    list.find((m) => m.slug === tail || m.kr_match_id === krId) ??
    null;

  const detail = await fetchKashRockMatchDetail(
    game.slug,
    fromList?.kr_match_id ?? krId,
  );

  if (fromList && detail) return mergeKrMatches(fromList, detail);
  if (detail) return detail;
  if (fromList) {
    const enriched = await enrichKashRockMatchesWithPlayerBoards(
      game.slug,
      [fromList],
      1,
    );
    return enriched[0] ?? fromList;
  }
  return null;
}

async function getKashRockBySlug(slug: string, game: EsportsGameConfig, tail: string) {
  const match = await resolveKashRockMatch(slug, game, tail);
  return match ? kashRockMatchToEvent(game, match) : null;
}

const DETAIL_TTL_MS = 6 * 60 * 1000;
const detailCache = new Map<string, { at: number; event: MatchEvent }>();

/** One upstream read per match every six minutes. Live page polls reuse this copy. */
export async function readEsportsMatch(slug: string): Promise<MatchEvent | null> {
  const hit = detailCache.get(slug);
  if (hit && Date.now() - hit.at < DETAIL_TTL_MS) return hit.event;
  const event = await getEsportsMatchBySlug(slug);
  if (event) detailCache.set(slug, { at: Date.now(), event });
  return event ?? hit?.event ?? null;
}

export async function getEsportsMatchBySlug(slug: string): Promise<MatchEvent | null> {
  if (!isEsportsDataConfigured()) return null;
  const m = slug.match(/^es-(lol|cs2|dota2|valorant)-(.+)$/);
  if (!m) return null;
  const game = getEsportsGame(m[1]);
  if (!game) return null;
  const tail = m[2];

  if (isKashRockConfigured()) {
    const fromKr = await getKashRockBySlug(slug, game, tail);
    if (fromKr || !isPandaScoreConfigured()) return fromKr;
  }

  for (const g of ESPORTS_GAMES) {
    const list = await fetchEsportsMatches(g.apiPrefix);
    for (const raw of list) {
      if (esportsEventSlug(g.slug, raw) !== slug) continue;
      let match = raw;
      if (raw.id) {
        const detail = await fetchEsportsMatchById(g.apiPrefix, raw.id);
        if (detail) match = detail;
      }
      match = await enrichMatchWithTeamRosters(match, g.apiPrefix);
      return pandaMatchToEvent(g, match);
    }
  }

  const numeric = /^\d+$/.test(tail) ? Number(tail) : NaN;
  if (!Number.isNaN(numeric)) {
    const detail = await fetchEsportsMatchById(game.apiPrefix, numeric);
    if (detail) {
      const enriched = await enrichMatchWithTeamRosters(detail, game.apiPrefix);
      return pandaMatchToEvent(game, enriched);
    }
  }

  return null;
}

/** Fresh KashRock pull for live detail pages (bypasses React `cache`). */
export async function refreshEsportsMatchBySlug(slug: string): Promise<MatchEvent | null> {
  if (!isKashRockConfigured()) return getEsportsMatchBySlug(slug);
  const m = slug.match(/^es-(lol|cs2|dota2|valorant)-(.+)$/);
  if (!m) return null;
  const game = getEsportsGame(m[1]);
  if (!game) return null;
  const match = await resolveKashRockMatch(slug, game, m[2]);
  return match ? kashRockMatchToEvent(game, match) : null;
}
