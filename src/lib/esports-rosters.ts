import { unstable_cache } from "next/cache";
import type { PsMatch } from "@/lib/pandascore";
import type { PsPlayer } from "@/lib/pandascore";
import {
  apiPrefixForMatch,
  fetchPandaTeamPlayersResolved,
  mapPool,
} from "@/lib/pandascore-teams";

function teamNeedsRoster(match: PsMatch, teamId: number): boolean {
  for (const slot of match.opponents ?? []) {
    if (slot.opponent?.id !== teamId) continue;
    return !(slot.opponent.players?.length ?? 0);
  }
  return false;
}

function attachPlayers(match: PsMatch, teamId: number, players: PsPlayer[]): PsMatch {
  const opponents = (match.opponents ?? []).map((slot) => {
    if (slot.opponent?.id !== teamId) return slot;
    if (slot.opponent.players?.length) return slot;
    return {
      ...slot,
      opponent: { ...slot.opponent, players },
    };
  });
  return { ...match, opponents };
}

type TeamFetchKey = `${string}:${number}`;

function teamFetchKey(teamId: number, apiPrefix: string): TeamFetchKey {
  return `${apiPrefix}:${teamId}`;
}

async function cachedTeamPlayers(teamId: number, apiPrefix: string): Promise<PsPlayer[] | null> {
  return unstable_cache(
    () => fetchPandaTeamPlayersResolved(teamId, apiPrefix),
    ["panda-team-players-v2", apiPrefix, String(teamId)],
    { revalidate: 900, tags: ["esports"] },
  )();
}

/** List/detail match payloads omit rosters — hydrate from team endpoints (rate-limit safe). */
export async function enrichMatchesWithTeamRosters(
  matches: PsMatch[],
  options?: {
    apiPrefixFallback?: string;
    concurrency?: number;
    /** Match detail: always refetch rosters (avoid stale empty cache). */
    skipCache?: boolean;
  },
): Promise<PsMatch[]> {
  const fallback = options?.apiPrefixFallback ?? "lol";
  const concurrency = options?.concurrency ?? 3;
  const skipCache = options?.skipCache ?? false;

  const teamJobs = new Map<TeamFetchKey, { teamId: number; apiPrefix: string }>();
  for (const match of matches) {
    const prefix = apiPrefixForMatch(match, fallback);
    for (const slot of match.opponents ?? []) {
      const id = slot.opponent?.id;
      if (!id || !teamNeedsRoster(match, id)) continue;
      const key = teamFetchKey(id, prefix);
      if (!teamJobs.has(key)) teamJobs.set(key, { teamId: id, apiPrefix: prefix });
    }
  }
  if (teamJobs.size === 0) return matches;

  const keys = [...teamJobs.keys()];
  const rosterByKey = new Map<TeamFetchKey, PsPlayer[]>();

  await mapPool(keys, concurrency, async (key) => {
    const job = teamJobs.get(key)!;
    let players: PsPlayer[] | null = null;
    if (!skipCache) {
      players = await cachedTeamPlayers(job.teamId, job.apiPrefix);
    }
    if (players === null) {
      players = await fetchPandaTeamPlayersResolved(job.teamId, job.apiPrefix);
    }
    if (players !== null) rosterByKey.set(key, players);
  });

  return matches.map((match) => {
    const prefix = apiPrefixForMatch(match, fallback);
    let next = match;
    for (const slot of match.opponents ?? []) {
      const id = slot.opponent?.id;
      if (!id || !teamNeedsRoster(next, id)) continue;
      const key = teamFetchKey(id, prefix);
      const players = rosterByKey.get(key);
      if (players?.length) next = attachPlayers(next, id, players);
    }
    return next;
  });
}

export async function enrichMatchWithTeamRosters(
  match: PsMatch,
  apiPrefixFallback?: string,
): Promise<PsMatch> {
  const [enriched] = await enrichMatchesWithTeamRosters([match], {
    apiPrefixFallback,
    concurrency: 2,
    skipCache: true,
  });
  return enriched;
}
