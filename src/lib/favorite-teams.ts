import { SIDELINE_LEAGUES, type LeagueConfig } from "./leagues";
import type {
  FavoritePair,
  FavoritePartition,
  FavoriteTeam,
  FavoriteTeamsMap,
  MatchEvent,
  Sport,
} from "./types";

export type { FavoritePair, FavoritePartition, FavoriteTeam, FavoriteTeamsMap };

export const FAVORITE_TEAMS_STORAGE_KEY = "sideline-favorite-teams-v1";

export function partitionKey(league: LeagueConfig): FavoritePartition {
  if (league.sport === "nba") return "nba";
  return `soccer:${league.slug}`;
}

export function favoritePartitions(): {
  key: FavoritePartition;
  league: LeagueConfig;
}[] {
  return SIDELINE_LEAGUES.map((league) => ({
    key: partitionKey(league),
    league,
  }));
}

export function parsePartition(key: FavoritePartition): {
  sport: "nba" | "soccer";
  leagueSlug?: string;
} {
  if (key === "nba") return { sport: "nba", leagueSlug: "nba" };
  if (key.startsWith("soccer:")) {
    return { sport: "soccer", leagueSlug: key.slice("soccer:".length) };
  }
  return { sport: "soccer" };
}

export function emptyFavorites(): FavoriteTeamsMap {
  return {};
}

export function normalizeFavorites(raw: unknown): FavoriteTeamsMap {
  if (!raw || typeof raw !== "object") return {};
  const out: FavoriteTeamsMap = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const pair = val as Record<string, unknown>;
    const primary = teamFrom(pair.primary);
    const secondary = teamFrom(pair.secondary);
    if (primary || secondary) {
      out[key] = { primary, secondary };
    }
  }
  return out;
}

function teamFrom(v: unknown): FavoriteTeam | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!id || !name) return undefined;
  return { id, name };
}

export type EventTeams = {
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
};

export function eventTeamsFromMatch(event: MatchEvent): EventTeams {
  return {
    homeTeamId: event.homeTeamId,
    awayTeamId: event.awayTeamId,
    homeTeamName: event.homeTeamName,
    awayTeamName: event.awayTeamName,
  };
}

export function eventHasTeam(event: MatchEvent, team: FavoriteTeam): boolean {
  const t = eventTeamsFromMatch(event);
  if (t.homeTeamId === team.id || t.awayTeamId === team.id) return true;
  const name = team.name.toLowerCase();
  return (
    t.homeTeamName?.toLowerCase() === name ||
    t.awayTeamName?.toLowerCase() === name ||
    event.title.en.toLowerCase().includes(name)
  );
}

export function eventMatchesPartition(
  event: MatchEvent,
  partition: FavoritePartition,
): boolean {
  const { sport, leagueSlug } = parsePartition(partition);
  if (event.sport !== sport) return false;
  if (sport === "nba") return true;
  if (!leagueSlug) return true;
  return event.leagueSlug === leagueSlug;
}

export function statusRank(status: MatchEvent["status"]): number {
  if (status === "live") return 0;
  if (status === "upcoming") return 1;
  return 2;
}

export function sortEventsForHome(
  events: MatchEvent[],
  favorites: FavoriteTeamsMap,
): MatchEvent[] {
  const primaryHits = new Set<string>();
  for (const event of events) {
    for (const { key } of favoritePartitions()) {
      const pair = favorites[key];
      if (!pair?.primary) continue;
      if (
        eventMatchesPartition(event, key) &&
        eventHasTeam(event, pair.primary)
      ) {
        primaryHits.add(event.id);
      }
    }
  }

  return [...events].sort((a, b) => {
    const aPrimary = primaryHits.has(a.id) ? 0 : 1;
    const bPrimary = primaryHits.has(b.id) ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    return b.startAt.localeCompare(a.startAt);
  });
}

export function primaryTeamForPartition(
  favorites: FavoriteTeamsMap,
  partition: FavoritePartition,
): FavoriteTeam | undefined {
  return favorites[partition]?.primary;
}

export function allPrimaryTeams(
  favorites: FavoriteTeamsMap,
): { partition: FavoritePartition; team: FavoriteTeam }[] {
  const out: { partition: FavoritePartition; team: FavoriteTeam }[] = [];
  for (const { key } of favoritePartitions()) {
    const team = favorites[key]?.primary;
    if (team) out.push({ partition: key, team });
  }
  return out;
}

export function sportFromPartition(partition: FavoritePartition): Sport {
  return parsePartition(partition).sport;
}

export function partitionToPath(partition: FavoritePartition): string {
  return partition.replace(":", "-");
}

export function pathToPartition(path: string): FavoritePartition {
  if (path === "nba") return "nba";
  if (path.startsWith("soccer-")) {
    return `soccer:${path.slice("soccer-".length)}`;
  }
  return path;
}
