import { cache } from "react";
import { getEvent, events } from "./data";
import { getEsportsMatchBySlug } from "./esports-catalog";
import { getLiveMatchBySlug } from "./fixtures-sync";
import type { MatchEvent } from "./types";

export const resolveEventBySlug = cache(async (slug: string): Promise<MatchEvent | null> => {
  if (slug.startsWith("es-")) {
    const es = await getEsportsMatchBySlug(slug);
    if (es) return es;
  }
  const live = await getLiveMatchBySlug(slug);
  if (live) return live;
  return getEvent(slug) ?? null;
});

export function legacyEventsForSport(sport: string) {
  return events.filter((e) => e.sport === sport && !e.live);
}
