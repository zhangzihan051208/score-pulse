import type { TeamSearchHit } from "@/lib/fixtures-sync";
import { searchTeamsInFixtures } from "@/lib/fixtures-sync";
import {
  hotWeightForTeam,
  popularTeamsMatchingQuery,
  rankTeamSearchHits,
  teamQueryRelevance,
} from "@/lib/team-popularity";
import { searchTeamsByName } from "@/lib/thesportsdb";

function inferSport(league: string): "nba" | "soccer" {
  return league.includes("NBA") || league.includes("Basketball") ? "nba" : "soccer";
}

function mergeTeam(pool: Map<string, TeamSearchHit>, hit: TeamSearchHit) {
  const prev = pool.get(hit.id);
  if (!prev) {
    pool.set(hit.id, hit);
    return;
  }
  if (!prev.league && hit.league) pool.set(hit.id, { ...prev, league: hit.league });
}

export async function intelligentTeamSearch(
  query: string,
  opts?: {
    limit?: number;
    sport?: "nba" | "soccer";
    leagueId?: string;
  },
): Promise<TeamSearchHit[]> {
  const q = query.trim();
  const limit = opts?.limit ?? 12;
  if (q.length < 2) return [];

  const pool = new Map<string, TeamSearchHit>();

  for (const hit of await searchTeamsInFixtures(q, opts?.sport, opts?.leagueId, 48)) {
    mergeTeam(pool, hit);
  }

  const remotePrimary = await searchTeamsByName(q);
  for (const t of remotePrimary) {
    if (!t.idTeam || !t.strTeam) continue;
    const league = t.strLeague ?? "";
    const sport = inferSport(league);
    if (opts?.sport && sport !== opts.sport) continue;
    mergeTeam(pool, {
      id: t.idTeam,
      name: t.strTeam,
      league: t.strLeague,
      sport,
    });
  }

  const popMatches = popularTeamsMatchingQuery(q, 10);
  for (const pop of popMatches.slice(0, 4)) {
    if (opts?.sport && pop.sport !== opts.sport) continue;
    const already = [...pool.values()].some(
      (t) => teamQueryRelevance(pop.canonical, t.name) >= 980,
    );
    if (already) continue;

    const remote = await searchTeamsByName(pop.canonical);
    for (const t of remote) {
      if (!t.idTeam || !t.strTeam) continue;
      const league = t.strLeague ?? "";
      const sport = inferSport(league);
      if (sport !== pop.sport) continue;
      if (opts?.sport && sport !== opts.sport) continue;
      if (teamQueryRelevance(pop.canonical, t.strTeam) < 500) continue;
      mergeTeam(pool, {
        id: t.idTeam,
        name: t.strTeam,
        league: t.strLeague,
        sport,
      });
    }
  }

  const ranked = rankTeamSearchHits(q, [...pool.values()]);
  return ranked.slice(0, limit);
}
