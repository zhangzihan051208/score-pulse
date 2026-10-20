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
): Promise<MatchEvent[]> {
  const games = gameSlug
    ? ESPORTS_GAMES.filter((g) => g.slug === gameSlug)
    : ESPORTS_GAMES;

  const perGameCap = gameSlug
    ? Math.max(limit, 24)
    : Math.max(Math.ceil(limit / games.length) + 8, 12);

  const buckets: MatchEvent[][] = [];
  for (const game of games) {
    const raw = await fetchKashRockMatches(game.slug, perGameCap + 8);
    const picked = sortKrMatches(raw, perGameCap);
    buckets.push(
      picked
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
  options?: { includeRosters?: boolean },
): Promise<MatchEvent[]> {
  if (!isEsportsDataConfigured()) return [];

  if (isKashRockConfigured()) {
    const fromKr = await listFromKashRock(gameSlug, limit);
    if (fromKr.length > 0 || !isPandaScoreConfigured()) {
      return fromKr;
    }
  }

  return listFromPandaScore(gameSlug, limit, options?.includeRosters ?? false);
}

async function getKashRockBySlug(slug: string, game: EsportsGameConfig, tail: string) {
  const krId = kashRockMatchId(game.slug, tail);
  let match = await fetchKashRockMatchDetail(game.slug, krId);
  if (!match) {
    const list = await fetchKashRockMatches(game.slug, 80);
    match =
      list.find((m) => kashRockEventSlug(game.slug, m) === slug) ??
      list.find((m) => m.slug === tail || m.kr_match_id === krId) ??
      null;
    if (match) {
      match =
        (await fetchKashRockMatchDetail(game.slug, match.kr_match_id)) ?? match;
    }
  }
  return match ? kashRockMatchToEvent(game, match) : null;
}

export async function getEsportsMatchBySlug(slug: string): Promise<MatchEvent | null> {
  if (!isEsportsDataConfigured()) return null;
  const m = slug.match(/^es-(lol|cs2|dota2|valorant)-(.+)$/);
  if (!m) return null;
  const game = getEsportsGame(m[1]);
  if (!game) return null;
  const tail = m[2];

  if (isKashRockConfigured()) {
    return getKashRockBySlug(slug, game, tail);
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
