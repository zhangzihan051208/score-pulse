import { findHonorTeam } from "@/lib/reputation/catalog";
import type { Sport } from "@/lib/types";

/**
 * Popularity from the current team honor board.
 * Rank 1 is 50. Clubs outside that fifty are 0.
 * Computed when a match is read. Not stored.
 */
export function teamHeat(sport: Sport, name: string | undefined | null): number {
  if (!name || (sport !== "nba" && sport !== "soccer")) return 0;
  const club = findHonorTeam(sport, name);
  if (!club || club.prestige < 1 || club.prestige > 50) return 0;
  return 51 - club.prestige;
}

/** A match takes the higher of its two clubs. */
export function matchTeamHeat(
  sport: Sport,
  home: string | undefined | null,
  away: string | undefined | null,
): number {
  return Math.max(teamHeat(sport, home), teamHeat(sport, away));
}
