import { fetchTeamById } from "@/lib/thesportsdb";
import { thesportsdbBudgets, upstreamAllows } from "@/lib/upstream-budget";
import type { MatchEvent } from "@/lib/types";

const BADGE_CACHE_MS = 86_400_000;
const MAX_LOOKUPS_PER_CALL = 12;

const badgeByTeamId = new Map<string, { url: string; at: number }>();

export function teamBadgeFromTsdbRaw(
  raw: Record<string, unknown> | null | undefined,
  side: "home" | "away",
): string | undefined {
  if (!raw) return undefined;
  const keys =
    side === "home"
      ? ["strHomeTeamBadge", "strHomeBadge"]
      : ["strAwayTeamBadge", "strAwayBadge"];
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function cachedBadge(teamId: string): string | undefined {
  const hit = badgeByTeamId.get(teamId);
  if (!hit) return undefined;
  if (Date.now() - hit.at > BADGE_CACHE_MS) {
    badgeByTeamId.delete(teamId);
    return undefined;
  }
  return hit.url;
}

async function lookupBadge(teamId: string): Promise<string | undefined> {
  const mem = cachedBadge(teamId);
  if (mem) return mem;
  if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) return undefined;
  const team = await fetchTeamById(teamId);
  const url = team?.strTeamBadge?.trim();
  if (url) badgeByTeamId.set(teamId, { url, at: Date.now() });
  return url;
}

/** Fill missing home/away logo URLs from TSDB team lookup (budget-capped). */
export async function fillMissingTeamLogos(
  events: MatchEvent[],
): Promise<MatchEvent[]> {
  if (events.length === 0) return events;

  const need = new Set<string>();
  for (const e of events) {
    if (e.homeTeamId && !e.homeTeamLogoUrl) need.add(e.homeTeamId);
    if (e.awayTeamId && !e.awayTeamLogoUrl) need.add(e.awayTeamId);
  }
  if (need.size === 0) return events;

  const ids = [...need].filter((id) => !cachedBadge(id)).slice(0, MAX_LOOKUPS_PER_CALL);
  await Promise.all(ids.map((id) => lookupBadge(id)));

  return events.map((e) => ({
    ...e,
    homeTeamLogoUrl:
      e.homeTeamLogoUrl ??
      (e.homeTeamId ? cachedBadge(e.homeTeamId) : undefined),
    awayTeamLogoUrl:
      e.awayTeamLogoUrl ??
      (e.awayTeamId ? cachedBadge(e.awayTeamId) : undefined),
  }));
}
