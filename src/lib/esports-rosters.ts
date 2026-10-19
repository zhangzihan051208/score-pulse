import { unstable_cache } from "next/cache";
import type { PsMatch } from "@/lib/pandascore";
import { fetchPandaTeamPlayers, type PsPlayer } from "@/lib/pandascore";

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

const cachedTeamPlayers = (teamId: number) =>
  unstable_cache(
    () => fetchPandaTeamPlayers(teamId),
    ["panda-team-players", String(teamId)],
    { revalidate: 600, tags: ["esports"] },
  )();

/** List/detail match payloads omit rosters — hydrate from `/teams/{id}`. */
export async function enrichMatchesWithTeamRosters(
  matches: PsMatch[],
): Promise<PsMatch[]> {
  const teamIds = new Set<number>();
  for (const match of matches) {
    for (const slot of match.opponents ?? []) {
      const id = slot.opponent?.id;
      if (id && teamNeedsRoster(match, id)) teamIds.add(id);
    }
  }
  if (teamIds.size === 0) return matches;

  const rosterByTeam = new Map<number, PsPlayer[]>();
  await Promise.all(
    [...teamIds].map(async (id) => {
      rosterByTeam.set(id, await cachedTeamPlayers(id));
    }),
  );

  return matches.map((match) => {
    let next = match;
    for (const id of teamIds) {
      if (!teamNeedsRoster(next, id)) continue;
      next = attachPlayers(next, id, rosterByTeam.get(id) ?? []);
    }
    return next;
  });
}

export async function enrichMatchWithTeamRosters(match: PsMatch): Promise<PsMatch> {
  const [enriched] = await enrichMatchesWithTeamRosters([match]);
  return enriched;
}
