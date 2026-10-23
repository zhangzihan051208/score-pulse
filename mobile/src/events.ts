import rawEvents from "./data/events.json";
import rawWeights from "./data/weights.json";
import type { Locale } from "./catalog";

export type Pair = { zh: string; en: string };

export type EventPlayer = {
  id: string;
  name: string;
  team: string;
  positionKey: string;
  role: Pair;
  result: Pair;
  highlight: Pair;
  stats: { label: Pair; value: string }[];
  scores: Record<string, number>;
  count: number;
};

export type SlimEvent = {
  id: string;
  slug: string;
  sport: string;
  leagueSlug: string | null;
  title: Pair;
  subtitle: Pair;
  venue: Pair;
  summary: Pair;
  startAt: string;
  status: "live" | "upcoming" | "ended";
  home: string | null;
  away: string | null;
  homeScore: number | null;
  awayScore: number | null;
  players: EventPlayer[];
};

export const matchEvents = rawEvents as SlimEvent[];

const positionWeights = rawWeights as Record<string, { dimensions: string[]; weights: Record<string, number> }>;

export const leagues = [
  { sport: "soccer", slug: "premier-league", zh: "英超", en: "Premier League" },
  { sport: "soccer", slug: "la-liga", zh: "西甲", en: "La Liga" },
  { sport: "soccer", slug: "bundesliga", zh: "德甲", en: "Bundesliga" },
  { sport: "soccer", slug: "serie-a", zh: "意甲", en: "Serie A" },
  { sport: "soccer", slug: "ligue-1", zh: "法甲", en: "Ligue 1" },
  { sport: "soccer", slug: "champions-league", zh: "欧冠", en: "Champions League" },
  { sport: "nba", slug: "nba", zh: "NBA", en: "NBA" },
] as const;

export const esportsGames = [
  { slug: "lol", zh: "英雄联盟", en: "League of Legends" },
  { slug: "cs2", zh: "CS2", en: "Counter-Strike 2" },
  { slug: "dota2", zh: "刀塔", en: "Dota 2" },
  { slug: "valorant", zh: "无畏契约", en: "Valorant" },
] as const;

export function pairText(locale: Locale, pair: Pair) {
  return locale === "zh" ? pair.zh || pair.en : pair.en || pair.zh;
}

export function weightedOverall(positionKey: string, scores: Record<string, number>) {
  const profile = positionWeights[positionKey];
  if (!profile) {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  return profile.dimensions.reduce(
    (sum, id) => sum + (scores[id] ?? 0) * (profile.weights[id] ?? 0),
    0,
  );
}

export function eventBySlug(slug: string) {
  return matchEvents.find((event) => event.slug === slug);
}

export function eventsForAthlete(id: string) {
  return matchEvents.filter((event) => event.players.some((player) => player.id === id));
}

export function eventsForTeam(name: string) {
  const blobName = name.toLowerCase();
  const aliases = [
    blobName,
    ...(blobName.includes("manchester city") ? ["man city"] : []),
    ...(blobName.includes("los angeles") ? ["lakers"] : []),
  ];
  return matchEvents.filter((event) => {
    const blob = [event.home, event.away, event.title.en, event.title.zh].filter(Boolean).join(" ").toLowerCase();
    if (aliases.some((alias) => blob.includes(alias))) return true;
    return blobName
      .split(/\s+/)
      .filter((word) => word.length >= 5)
      .some((word) => blob.includes(word));
  });
}

export function hotPlayers(limit = 8) {
  return matchEvents
    .flatMap((event) =>
      event.players.map((player) => ({
        event,
        player,
        overall: weightedOverall(player.positionKey, player.scores),
      })),
    )
    .sort((a, b) => b.overall - a.overall)
    .slice(0, limit);
}
