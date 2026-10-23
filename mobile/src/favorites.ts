import { catalog, team, type TeamCard } from "./catalog";
import type { Favorites } from "./store";

export type Partition = {
  key: string;
  sport: string;
  zh: string;
  en: string;
  /** Domestic league printed on the club card. Empty means the European shortlist. */
  subtitle: string;
};

/** Same boards as the website welcome guide: NBA plus six soccer leagues. */
export const PARTITIONS: Partition[] = [
  { key: "nba", sport: "nba", zh: "NBA", en: "NBA", subtitle: "NBA" },
  { key: "soccer:premier-league", sport: "soccer", zh: "英超", en: "Premier League", subtitle: "Premier League" },
  { key: "soccer:la-liga", sport: "soccer", zh: "西甲", en: "La Liga", subtitle: "La Liga" },
  { key: "soccer:bundesliga", sport: "soccer", zh: "德甲", en: "Bundesliga", subtitle: "Bundesliga" },
  { key: "soccer:serie-a", sport: "soccer", zh: "意甲", en: "Serie A", subtitle: "Serie A" },
  { key: "soccer:ligue-1", sport: "soccer", zh: "法甲", en: "Ligue 1", subtitle: "Ligue 1" },
  { key: "soccer:champions-league", sport: "soccer", zh: "欧冠", en: "Champions League", subtitle: "" },
];

export function sportOfFavoriteKey(key: string) {
  if (key.startsWith("soccer:")) return "soccer";
  const cut = key.indexOf(":");
  return cut === -1 ? key : key.slice(0, cut);
}

export function clubsForPartition(partition: Partition, limit = 6): TeamCard[] {
  const clubs = Object.values(catalog.teams).filter((club) => club.sport === partition.sport);
  const matched = partition.subtitle ? clubs.filter((club) => club.subtitle === partition.subtitle) : clubs;
  return matched.sort((a, b) => a.rank - b.rank).slice(0, limit);
}

export function favoriteNames(favorites: Favorites) {
  const names: string[] = [];
  for (const [key, slots] of Object.entries(favorites)) {
    const sport = sportOfFavoriteKey(key);
    for (const id of [slots?.primary, slots?.secondary]) {
      if (!id) continue;
      const name = team(sport, id)?.name;
      if (name) names.push(name);
    }
  }
  return names;
}
