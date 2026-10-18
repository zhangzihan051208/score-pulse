import type { Sport } from "./types";

export type LeagueConfig = {
  tsdbId: string;
  slug: string;
  sport: "nba" | "soccer";
  /** English label (also used for TSDB name matching) */
  label: string;
  /** Substrings that match ev.strLeague from TheSportsDB */
  nameHints: string[];
};

export const SIDELINE_LEAGUES: LeagueConfig[] = [
  {
    tsdbId: "4387",
    slug: "nba",
    sport: "nba",
    label: "NBA",
    nameHints: ["NBA"],
  },
  {
    tsdbId: "4328",
    slug: "premier-league",
    sport: "soccer",
    label: "Premier League",
    nameHints: ["English Premier League", "Premier League"],
  },
  {
    tsdbId: "4335",
    slug: "la-liga",
    sport: "soccer",
    label: "La Liga",
    nameHints: ["La Liga", "Spanish La Liga"],
  },
  {
    tsdbId: "4331",
    slug: "bundesliga",
    sport: "soccer",
    label: "Bundesliga",
    nameHints: ["Bundesliga", "German Bundesliga"],
  },
  {
    tsdbId: "4332",
    slug: "serie-a",
    sport: "soccer",
    label: "Serie A",
    nameHints: ["Serie A", "Italian Serie A"],
  },
  {
    tsdbId: "4334",
    slug: "ligue-1",
    sport: "soccer",
    label: "Ligue 1",
    nameHints: ["Ligue 1", "French Ligue 1"],
  },
  {
    tsdbId: "4480",
    slug: "champions-league",
    sport: "soccer",
    label: "UEFA Champions League",
    nameHints: ["UEFA Champions League", "Champions League"],
  },
];

const byTsdbId = new Map(SIDELINE_LEAGUES.map((l) => [l.tsdbId, l]));
const bySlug = new Map(SIDELINE_LEAGUES.map((l) => [l.slug, l]));

export const TRACKED_LEAGUE_IDS = new Set(SIDELINE_LEAGUES.map((l) => l.tsdbId));

export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
  return bySlug.get(slug);
}

export function getLeagueByTsdbId(id: string | null | undefined): LeagueConfig | undefined {
  if (!id) return undefined;
  return byTsdbId.get(id);
}

export function leaguesForSport(sport: Sport): LeagueConfig[] {
  if (sport === "nba") return SIDELINE_LEAGUES.filter((l) => l.sport === "nba");
  if (sport === "soccer") return SIDELINE_LEAGUES.filter((l) => l.sport === "soccer");
  return [];
}

export function leagueMatchesRow(row: {
  sport: string;
  league_id?: string | null;
  str_league?: string | null;
}): LeagueConfig | undefined {
  if (row.league_id) {
    const hit = byTsdbId.get(row.league_id);
    if (hit && hit.sport === row.sport) return hit;
  }
  const name = row.str_league ?? "";
  for (const league of SIDELINE_LEAGUES) {
    if (league.sport !== row.sport) continue;
    if (league.nameHints.some((h) => name.includes(h))) return league;
  }
  if (row.sport === "nba" && name.includes("NBA")) {
    return byTsdbId.get("4387");
  }
  return undefined;
}

export function isTrackedFixture(row: {
  sport: string;
  league_id?: string | null;
  str_league?: string | null;
}): boolean {
  return Boolean(leagueMatchesRow(row));
}

export function tsdbEventBelongsToLeague(ev: {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
}, league: LeagueConfig): boolean {
  if (ev.idLeague === league.tsdbId) return true;
  const name = ev.strLeague ?? "";
  return league.nameHints.some((h) => name.includes(h));
}
