import {
  fetchTeamById,
  pickTsdbTeamBadge,
  searchTeamsByName,
} from "@/lib/thesportsdb";
import honorBadgeUrls from "@/lib/honor-team-badge-urls.json";
import { honorTsdbId } from "@/lib/honor-tsdb-team-ids";
import { thesportsdbBudgets, upstreamAllows } from "@/lib/upstream-budget";
import type { MatchEvent, Sport } from "@/lib/types";
import type { ReputationCard } from "@/lib/reputation/types";
import { unstable_cache } from "next/cache";

const BADGE_CACHE_MS = 86_400_000;
const MAX_LOOKUPS_PER_CALL = 16;

const badgeByTeamId = new Map<string, { url: string; at: number }>();

export function teamBadgeFromTsdbRaw(
  raw: Record<string, unknown> | null | undefined,
  side: "home" | "away",
): string | undefined {
  if (!raw) return undefined;
  const keys =
    side === "home"
      ? ["strHomeTeamBadge", "strHomeBadge", "strBadgeHome"]
      : ["strAwayTeamBadge", "strAwayBadge", "strBadgeAway"];
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
  const url = pickTsdbTeamBadge(team);
  if (url) badgeByTeamId.set(teamId, { url, at: Date.now() });
  return url;
}

const knownCrests = honorBadgeUrls as Record<string, string>;

/** Crest from the bundled club list, matched on a normalized name. */
export function knownCrestUrl(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const n = normTeamName(name);
  if (!n) return undefined;
  if (knownCrests[n]) return knownCrests[n];
  let bestKey = "";
  let bestUrl: string | undefined;
  for (const [key, url] of Object.entries(knownCrests)) {
    if (key.length < 4) continue;
    const hit = n === key || n.startsWith(key) || n.endsWith(key) || n.includes(key);
    if (!hit || key.length <= bestKey.length) continue;
    bestKey = key;
    bestUrl = url;
  }
  return bestUrl;
}

export function applyKnownCrests(events: MatchEvent[]): MatchEvent[] {
  return events.map((event) => ({
    ...event,
    homeTeamLogoUrl: event.homeTeamLogoUrl || knownCrestUrl(event.homeTeamName),
    awayTeamLogoUrl: event.awayTeamLogoUrl || knownCrestUrl(event.awayTeamName),
  }));
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

const TOP_SOCCER_LEAGUE_MARKERS = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "Portuguese Primeira Liga",
  "Dutch Eredivisie",
  "UEFA Champions League",
];

function isLowPrioritySoccerTeam(teamName: string, league: string) {
  const blob = `${teamName} ${league}`;
  return /esports|league of legends|dota|women|femin|u19|u21|u23|national 3|amateur|youth|reserves| ii\b| b\b|w\.? \d/i.test(
    blob,
  );
}

function pickTeamFromSearch(
  teams: { idTeam: string; strTeam: string; strLeague?: string; strBadge?: string | null; strTeamBadge?: string | null }[],
  queryName: string,
  sport: "nba" | "soccer",
) {
  const normQ = normTeamName(queryName);
  let best: (typeof teams)[number] | undefined;
  let bestScore = -Infinity;

  for (const t of teams) {
    const league = t.strLeague ?? "";
    const isNba = league.includes("NBA") || league.includes("Basketball");
    if (sport === "nba") {
      if (!isNba) continue;
    } else if (isNba || isLowPrioritySoccerTeam(t.strTeam, league)) {
      continue;
    }

    const normT = normTeamName(t.strTeam);
    let score = 0;
    if (normT === normQ) score += 200;
    else {
      const a = normQ.length >= normT.length ? normQ : normT;
      const b = normQ.length >= normT.length ? normT : normQ;
      if (a.includes(b) && b.length >= 4) score += 50;
    }
    for (const marker of TOP_SOCCER_LEAGUE_MARKERS) {
      if (league.includes(marker)) {
        score += 35;
        break;
      }
    }
    if (pickTsdbTeamBadge(t)) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  return best;
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
    const match = pickTeamFromSearch(teams, opts.teamName, opts.sport);
    if (match) {
      const fromSearch = pickTsdbTeamBadge(match);
      if (fromSearch) {
        badgeByName.set(key, { url: fromSearch, at: Date.now() });
        if (match.idTeam) {
          badgeByTeamId.set(match.idTeam, { url: fromSearch, at: Date.now() });
        }
        return fromSearch;
      }
      if (match.idTeam) {
        const url = await lookupBadge(match.idTeam);
        if (url) {
          badgeByName.set(key, { url, at: Date.now() });
          return url;
        }
      }
    }
  }
  return undefined;
}

function honorBadgeLookupCap(): number {
  const key = process.env.THESPORTSDB_API_KEY?.trim();
  return key && key !== "123" ? 120 : 40;
}

const honorBadgeById = honorBadgeUrls as Record<string, string>;

function resolveBadgeCached(teamName: string, sport: "nba" | "soccer") {
  return unstable_cache(
    async () => resolveTeamBadgeUrl({ teamName, sport }),
    ["honor-team-badge", sport, normTeamName(teamName)],
    { revalidate: 86_400 * 7 },
  )();
}

/** Static crest URL for honor-board clubs (no upstream call). */
export function honorTeamBadgeUrl(honorId: string): string | undefined {
  return honorBadgeById[honorId];
}

/** Honor-board club crest: pinned TSDB id, then static URL, then name search. */
export async function resolveHonorTeamBadge(
  honorId: string,
  teamName: string,
  sport: "nba" | "soccer",
): Promise<string | undefined> {
  const pinnedId = honorTsdbId(honorId);
  if (pinnedId) {
    const fromId = await lookupBadge(pinnedId);
    if (fromId) return fromId;
  }
  const staticUrl = honorBadgeById[honorId];
  if (staticUrl) return staticUrl;
  return resolveTeamBadgeUrl({
    teamName,
    sport,
    tsdbTeamId: pinnedId,
  });
}

/** Attach TSDB crest URLs to honor-board team cards. */
export async function enrichHonorTeamBadges(
  entries: ReputationCard[],
): Promise<ReputationCard[]> {
  const out: ReputationCard[] = [];
  let budget = honorBadgeLookupCap();
  for (const entry of entries) {
    if (entry.photoUrl) {
      out.push(entry);
      continue;
    }
    if (entry.sport !== "nba" && entry.sport !== "soccer") {
      out.push(entry);
      continue;
    }
    const pinnedId = honorTsdbId(entry.id);
    if (pinnedId) {
      const fromId = await lookupBadge(pinnedId);
      if (fromId) {
        out.push({ ...entry, photoUrl: fromId });
        continue;
      }
    }
    const staticUrl = honorBadgeById[entry.id];
    if (staticUrl) {
      out.push({ ...entry, photoUrl: staticUrl });
      continue;
    }
    if (budget <= 0) {
      out.push(entry);
      continue;
    }
    budget -= 1;
    const photoUrl = await resolveBadgeCached(entry.name, entry.sport);
    out.push(photoUrl ? { ...entry, photoUrl } : entry);
  }
  return out;
}
