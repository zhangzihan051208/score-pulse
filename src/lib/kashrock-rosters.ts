import { unstable_cache } from "next/cache";
import type { KrMatch } from "@/lib/kashrock";
import { fetchKashRockMatchDetail } from "@/lib/kashrock";
import { krMatchHasPlayerData } from "@/lib/kashrock-normalize";

const cachedBoard = (krSport: string, krMatchId: string) =>
  unstable_cache(
    () => fetchKashRockMatchDetail(krSport, krMatchId),
    ["kr-player-board", krSport, krMatchId],
    { revalidate: 600, tags: ["esports"] },
  )();

function mergeBoard(base: KrMatch, detail: KrMatch | null): KrMatch {
  if (!detail?.include?.player_board) return base;
  return {
    ...base,
    ...detail,
    include: detail.include,
  };
}

/** Attach player boards for the first N matches (live/upcoming first) to save API quota. */
export async function enrichKashRockMatchesWithPlayerBoards(
  krSport: string,
  matches: KrMatch[],
  maxEnrich = 8,
): Promise<KrMatch[]> {
  if (matches.length === 0 || maxEnrich <= 0) return matches;

  const rank = (m: KrMatch) => {
    if (m.status === "current" || m.status === "live") return 0;
    if (m.status === "not_started") return 1;
    return 2;
  };

  const targets = [...matches]
    .sort((a, b) => {
      const sr = rank(a) - rank(b);
      if (sr !== 0) return sr;
      return (b.event_time ?? "").localeCompare(a.event_time ?? "");
    })
    .slice(0, maxEnrich);

  const boardById = new Map<string, KrMatch>();
  await Promise.all(
    targets.map(async (m) => {
      if (krMatchHasPlayerData(m)) return;
      const detail = await cachedBoard(krSport, m.kr_match_id);
      if (detail) boardById.set(m.kr_match_id, detail);
    }),
  );

  return matches.map((m) => mergeBoard(m, boardById.get(m.kr_match_id) ?? null));
}
