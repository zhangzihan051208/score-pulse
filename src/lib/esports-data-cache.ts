import { unstable_cache } from "next/cache";
import { listEsportsMatchEvents } from "@/lib/esports-catalog";
import type { EsportsGameSlug } from "@/lib/esports-games";

export function cachedEsportsMatchEvents(
  gameSlug?: EsportsGameSlug,
  limit = 32,
): Promise<Awaited<ReturnType<typeof listEsportsMatchEvents>>> {
  return unstable_cache(
    () => listEsportsMatchEvents(gameSlug, limit),
    ["esports-match-events", gameSlug ?? "all", String(limit)],
    { revalidate: 45, tags: ["esports"] },
  )();
}
