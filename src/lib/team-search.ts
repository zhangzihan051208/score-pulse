import type { TeamSearchHit } from "@/lib/fixtures-sync";
import { searchTeamsInFixtures } from "@/lib/fixtures-sync";
import { getLeagueBySlug, getLeagueByTsdbId, type LeagueConfig } from "@/lib/leagues";
import {
  enrichTeamSearchHit,
  teamBelongsToLeague,
} from "@/lib/team-league";
import {
  hotWeightForTeam,
  popularTeamsMatchingQuery,
  rankTeamSearchHits,
  teamQueryRelevance,
} from "@/lib/team-popularity";
import { getDegradedMode } from "@/lib/service-degraded";
import { tsdbIdForTeamName } from "@/lib/honor-tsdb-team-ids";
import { fetchTeamById, searchTeamsByName } from "@/lib/thesportsdb";

function inferSport(league: string): "nba" | "soccer" {
  return league.includes("NBA") || league.includes("Basketball") ? "nba" : "soccer";
}

function skipRemoteTeam(name: string, league: string) {
  return /esports|league of legends|dota|women|femin|u19|u21|u23|national 3|amateur|youth|reserves/i.test(
    `${name} ${league}`,
  );
}

function mergeTeam(pool: Map<string, TeamSearchHit>, hit: TeamSearchHit) {
  const enriched = enrichTeamSearchHit(hit);
  const prev = pool.get(enriched.id);
  if (!prev) {
    pool.set(enriched.id, enriched);
    return;
  }
  pool.set(enriched.id, enrichTeamSearchHit({ ...prev, ...enriched }));
}

function resolveLeagueFilter(opts?: {
  leagueId?: string;
  leagueSlug?: string;
}): LeagueConfig | undefined {
  if (opts?.leagueSlug) return getLeagueBySlug(opts.leagueSlug);
  if (opts?.leagueId) return getLeagueByTsdbId(opts.leagueId);
  return undefined;
}

export async function intelligentTeamSearch(
  query: string,
  opts?: {
    limit?: number;
    sport?: "nba" | "soccer";
    leagueId?: string;
    leagueSlug?: string;
    /** When true (default if league set), drop teams outside the league partition. */
    strictLeague?: boolean;
  },
): Promise<TeamSearchHit[]> {
  const q = query.trim();
  const limit = opts?.limit ?? 12;
  if (q.length < 2) return [];

  const leagueFilter = resolveLeagueFilter(opts);
  const strictLeague =
    opts?.strictLeague ?? Boolean(leagueFilter);
  const leagueId = leagueFilter?.tsdbId ?? opts?.leagueId;

  const pool = new Map<string, TeamSearchHit>();

  for (const hit of await searchTeamsInFixtures(
    q,
    opts?.sport,
    leagueId,
    strictLeague ? 64 : 48,
  )) {
    if (strictLeague && leagueFilter && !teamBelongsToLeague(hit, leagueFilter)) continue;
    mergeTeam(pool, hit);
  }

  const addRemote = async (teams: Awaited<ReturnType<typeof searchTeamsByName>>) => {
    for (const t of teams) {
      if (!t.idTeam || !t.strTeam) continue;
      const league = t.strLeague ?? "";
      if (skipRemoteTeam(t.strTeam, league)) continue;
      const sport = inferSport(league);
      if (opts?.sport && sport !== opts.sport) continue;
      const hit = enrichTeamSearchHit({
        id: t.idTeam,
        name: t.strTeam,
        league: t.strLeague,
        sport,
      });
      if (strictLeague && leagueFilter && !teamBelongsToLeague(hit, leagueFilter)) {
        continue;
      }
      mergeTeam(pool, hit);
    }
  };

  const knownId = tsdbIdForTeamName(q);
  if (knownId && opts?.sport !== "nba") {
    try {
      const team = await fetchTeamById(knownId);
      mergeTeam(pool, {
        id: knownId,
        name: team?.strTeam?.trim() || q,
        league: team?.strLeague,
        sport: "soccer",
      });
    } catch {
      mergeTeam(pool, {
        id: knownId,
        name: q,
        league: "French Ligue 1",
        sport: "soccer",
      });
    }
  }

  const remoteOk = !getDegradedMode().noRemoteSearch;

  if (remoteOk && (!strictLeague || pool.size < limit)) {
    try {
      await addRemote(await searchTeamsByName(q));
    } catch {
      /* fixtures-only search */
    }
  }

  if (remoteOk && !strictLeague) {
    const popMatches = popularTeamsMatchingQuery(q, 10);
    for (const pop of popMatches.slice(0, 4)) {
      if (opts?.sport && pop.sport !== opts.sport) continue;
      const already = [...pool.values()].some(
        (t) => teamQueryRelevance(pop.canonical, t.name) >= 980,
      );
      if (already) continue;

      try {
        await addRemote(await searchTeamsByName(pop.canonical));
      } catch {
        /* skip */
      }
    }
  }

  let ranked = rankTeamSearchHits(q, [...pool.values()]);
  if (strictLeague && leagueFilter) {
    ranked = ranked.filter((t) => teamBelongsToLeague(t, leagueFilter));
  }

  return ranked.slice(0, limit);
}

export function withHotWeights(teams: TeamSearchHit[]) {
  return teams.map((team) => ({
    ...team,
    hotWeight: hotWeightForTeam(team.name, team.sport),
  }));
}
