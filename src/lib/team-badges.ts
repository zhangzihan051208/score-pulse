import { fetchTeamById, searchTeamsByName } from "@/lib/thesportsdb";
import { thesportsdbBudgets, upstreamAllows } from "@/lib/upstream-budget";
import type { MatchEvent, Sport } from "@/lib/types";
import type { ReputationCard } from "@/lib/reputation/types";

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

function normTeamName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const badgeByName = new Map<string, { url: string; at: number }>();

function nameCacheKey(sport: "nba" | "soccer", name: string) {
  return `${sport}:${normTeamName(name)}`;
}

/** Resolve a club crest from TSDB id and/or display name (NBA/soccer). */
export async function resolveTeamBadgeUrl(opts: {
  tsdbTeamId?: string;
  teamName?: string;
  sport: Sport;
}): Promise<string | undefined> {
  if (opts.tsdbTeamId) {
    const fromId = await lookupBadge(opts.tsdbTeamId);
    if (fromId) return fromId;
  }
  if (
    opts.teamName &&
    (opts.sport === "nba" || opts.sport === "soccer")
  ) {
    const key = nameCacheKey(opts.sport, opts.teamName);
    const hit = badgeByName.get(key);
    if (hit && Date.now() - hit.at <= BADGE_CACHE_MS) return hit.url;

    if (!upstreamAllows("thesportsdb", thesportsdbBudgets())) {
      return hit?.url;
    }

    const teams = await searchTeamsByName(opts.teamName);
    const match = teams.find((t) => {
      const league = t.strLeague ?? "";
      const isNba = league.includes("NBA") || league.includes("Basketball");
      return opts.sport === "nba" ? isNba : !isNba;
    });
    if (match?.idTeam) {
      const url = await lookupBadge(match.idTeam);
      if (url) {
        badgeByName.set(key, { url, at: Date.now() });
        return url;
      }
    }
    if (match?.strTeamBadge?.trim()) {
      const url = match.strTeamBadge.trim();
      badgeByName.set(key, { url, at: Date.now() });
      if (match.idTeam) badgeByTeamId.set(match.idTeam, { url, at: Date.now() });
      return url;
    }
  }
  return undefined;
}

const HONOR_BADGE_CAP = 55;

/** Attach TSDB crest URLs to honor-board team cards. */
export async function enrichHonorTeamBadges(
  entries: ReputationCard[],
): Promise<ReputationCard[]> {
  const out: ReputationCard[] = [];
  let budget = HONOR_BADGE_CAP;
  for (const entry of entries) {
    if (budget <= 0) {
      out.push(entry);
      continue;
    }
    if (entry.photoUrl) {
      out.push(entry);
      continue;
    }
    if (entry.sport !== "nba" && entry.sport !== "soccer") {
      out.push(entry);
      continue;
    }
    budget -= 1;
    const photoUrl = await resolveTeamBadgeUrl({
      teamName: entry.name,
      sport: entry.sport,
    });
    out.push(photoUrl ? { ...entry, photoUrl } : entry);
  }
  return out;
}
