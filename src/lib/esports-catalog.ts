import {
  ESPORTS_GAMES,
  getEsportsGame,
  type EsportsGameSlug,
} from "@/lib/esports-games";
import { pandaMatchToEvent, esportsEventSlug } from "@/lib/esports-match";
import {
  fetchEsportsMatchById,
  fetchEsportsMatches,
  isPandaScoreConfigured,
} from "@/lib/pandascore";
import type { MatchEvent } from "@/lib/types";

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
): Promise<MatchEvent[]> {
  if (!isPandaScoreConfigured()) return [];

  const games = gameSlug
    ? ESPORTS_GAMES.filter((g) => g.slug === gameSlug)
    : ESPORTS_GAMES;

  const buckets = await Promise.all(
    games.map(async (game) => {
      const raw = await fetchEsportsMatches(game.apiPrefix);
      return raw
        .map((m) => pandaMatchToEvent(game, m))
        .filter((e): e is MatchEvent => Boolean(e));
    }),
  );

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
      if (esportsEventSlug(g.slug, raw) === slug) {
        let event = pandaMatchToEvent(g, raw);
        if (event && event.performances.length === 0 && raw.id) {
          const detail = await fetchEsportsMatchById(g.apiPrefix, raw.id);
          if (detail) event = pandaMatchToEvent(g, detail) ?? event;
        }
        return event;
      }
    }
  }

  const numeric = /^\d+$/.test(tail) ? Number(tail) : NaN;
  if (!Number.isNaN(numeric)) {
    const detail = await fetchEsportsMatchById(game.apiPrefix, numeric);
    if (detail) return pandaMatchToEvent(game, detail);
  }

  return null;
}
