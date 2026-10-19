import { leagueLabel } from "@/i18n/league-labels";
import type { TeamSearchHit } from "@/lib/fixtures-sync";
import {
  getLeagueBySlug,
  getLeagueByTsdbId,
  leagueMatchesRow,
  leagueNameMatches,
  type LeagueConfig,
} from "@/lib/leagues";
import type { Locale } from "@/lib/types";

export function resolveLeagueForTeam(
  hit: Pick<TeamSearchHit, "sport" | "league" | "leagueSlug" | "leagueId">,
): LeagueConfig | undefined {
  if (hit.leagueSlug) {
    return getLeagueBySlug(hit.leagueSlug);
  }
  if (hit.leagueId) {
    const byId = getLeagueByTsdbId(hit.leagueId);
    if (byId && byId.sport === hit.sport) return byId;
  }
  return leagueMatchesRow({
    sport: hit.sport,
    league_id: hit.leagueId ?? undefined,
    str_league: hit.league ?? null,
  });
}

export function enrichTeamSearchHit(
  hit: TeamSearchHit,
  fixtureLeagueId?: string | null,
): TeamSearchHit {
  const league = resolveLeagueForTeam({
    ...hit,
    leagueId: fixtureLeagueId ?? hit.leagueId,
  });
  return {
    ...hit,
    leagueSlug: league?.slug ?? hit.leagueSlug,
    leagueId: league?.tsdbId ?? hit.leagueId ?? fixtureLeagueId ?? undefined,
    league: hit.league ?? league?.label,
  };
}

/** True when the team is in this Sideline league partition (for favorite-team picker). */
export function teamBelongsToLeague(
  hit: TeamSearchHit,
  league: LeagueConfig,
): boolean {
  if (hit.sport !== league.sport) return false;

  if (hit.leagueSlug) return hit.leagueSlug === league.slug;

  if (hit.leagueId && hit.leagueId === league.tsdbId) {
    if (!hit.league || leagueNameMatches(league, hit.league)) return true;
  }

  if (hit.league && leagueNameMatches(league, hit.league)) return true;

  if (league.sport === "nba" && league.slug === "nba") {
    const name = hit.league ?? "";
    if (!name || name.includes("NBA") || name.includes("Basketball")) return true;
  }

  return false;
}

export function groupTeamsByLeague(
  teams: TeamSearchHit[],
  locale: Locale,
): { leagueSlug: string; label: string; teams: TeamSearchHit[] }[] {
  const buckets = new Map<string, TeamSearchHit[]>();

  for (const team of teams) {
    const slug =
      team.leagueSlug ??
      resolveLeagueForTeam(team)?.slug ??
      (team.sport === "nba" ? "nba" : "other");
    const list = buckets.get(slug) ?? [];
    list.push(team);
    buckets.set(slug, list);
  }

  const order = [
    "nba",
    "premier-league",
    "la-liga",
    "bundesliga",
    "serie-a",
    "ligue-1",
    "champions-league",
    "other",
  ];

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([leagueSlug, list]) => ({
      leagueSlug,
      label:
        leagueSlug === "other"
          ? locale === "zh"
            ? "其他"
            : "Other"
          : leagueLabel(locale, leagueSlug),
      teams: list,
    }));
}
