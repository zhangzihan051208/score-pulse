import {
  ESPORTS_GAMES,
  getEsportsGame,
  type EsportsGameSlug,
} from "@/lib/esports-games";
import { pandaMatchToEvent, esportsEventSlug } from "@/lib/esports-match";
import { enrichMatchesWithTeamRosters, enrichMatchWithTeamRosters } from "@/lib/esports-rosters";
import {
  fetchEsportsMatchById,
  fetchEsportsMatches,
  isPandaScoreConfigured,
} from "@/lib/pandascore";
import type { PsMatch } from "@/lib/pandascore";
import type { MatchEvent } from "@/lib/types";

function rawStatusRank(status?: string): number {
  if (status === "running") return 0;
  if (status === "not_started") return 1;
  return 2;
}

/** Trim before roster hydration so we do not fan out hundreds of `/teams` calls. */
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

function sortEvents(list: MatchEvent[]) {
  const rank = { live: 0, upcoming: 1, ended: 2 } as const;
  return [...list].sort((a, b) => {
    const sr = rank[a.status] - rank[b.status];
    if (sr !== 0) return sr;
    return b.startAt.localeCompare(a.startAt);
  });
}

export async function listEsportsMatchEvents(
  gameSlug?: EsportsGameSlug,
  limit = 32,
  options?: { includeRosters?: boolean },
): Promise<MatchEvent[]> {
  if (!isPandaScoreConfigured()) return [];

  const games = gameSlug
    ? ESPORTS_GAMES.filter((g) => g.slug === gameSlug)
    : ESPORTS_GAMES;

  const perGameCap = gameSlug
    ? Math.max(limit, 24)
    : Math.max(Math.ceil(limit / games.length) + 8, 16);

  const includeRosters = options?.includeRosters ?? false;
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

export async function getEsportsMatchBySlug(slug: string): Promise<MatchEvent | null> {
  if (!isPandaScoreConfigured()) return null;
  const m = slug.match(/^es-(lol|cs2|dota2|valorant)-(.+)$/);
  if (!m) return null;
  const game = getEsportsGame(m[1]);
  if (!game) return null;
  const tail = m[2];

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
