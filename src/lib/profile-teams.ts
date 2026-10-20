import { favoritePartitions, parsePartition } from "@/lib/favorite-teams";
import type { FavoriteTeam, FavoriteTeamsMap } from "@/lib/types";

export type ProfileTeamCrest = {
  partition: string;
  role: "primary" | "secondary";
  team: FavoriteTeam;
  sport: "nba" | "soccer";
  leagueSlug?: string;
};

export function crestTeamsFromFavorites(
  favorites: FavoriteTeamsMap,
): ProfileTeamCrest[] {
  const out: ProfileTeamCrest[] = [];
  for (const { key } of favoritePartitions()) {
    const pair = favorites[key];
    if (!pair) continue;
    const { sport, leagueSlug } = parsePartition(key);
    if (pair.primary) {
      out.push({
        partition: key,
        role: "primary",
        team: pair.primary,
        sport,
        leagueSlug,
      });
    }
    if (pair.secondary) {
      out.push({
        partition: key,
        role: "secondary",
        team: pair.secondary,
        sport,
        leagueSlug,
      });
    }
  }
  return out;
}
