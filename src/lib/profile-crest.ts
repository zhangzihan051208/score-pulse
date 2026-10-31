import { normalizeFavorites } from "@/lib/favorite-teams";
import { primaryCrestFromFavorites } from "@/lib/profile-teams";

export type ProfileCrestBadge = {
  url: string;
  name: string;
};

export function crestBadgeFromProfileRow(row: {
  favorite_teams?: unknown;
  hide_primary_crest?: boolean | null;
}): ProfileCrestBadge | null {
  if (row.hide_primary_crest) return null;
  const crest = primaryCrestFromFavorites(normalizeFavorites(row.favorite_teams));
  const url = crest?.team.badgeUrl?.trim();
  if (!crest || !url) return null;
  return { url, name: crest.team.name };
}
