import { cache } from "react";
import { getEvent, events } from "./data";
import { getLiveMatchBySlug } from "./fixtures-sync";
import type { MatchEvent } from "./types";

export const resolveEventBySlug = cache(async (slug: string): Promise<MatchEvent | null> => {
  const live = await getLiveMatchBySlug(slug);
  if (live) return live;
  return getEvent(slug) ?? null;
});

export function legacyEventsForSport(sport: string) {
  return events.filter((e) => e.sport === sport && !e.live);
}
