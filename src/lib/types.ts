export const LOCALES = ["en", "zh", "es", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized = Record<Locale, string>;

export const SPORTS = ["nba", "soccer", "nfl", "f1", "tennis", "ufc"] as const;
export type Sport = (typeof SPORTS)[number];

export type EventStatus = "live" | "upcoming" | "ended";

export type ScoreMap = Record<string, number>;

export type Athlete = {
  id: string;
  name: string;
  shortName: string;
  country: Localized;
  team?: string;
};

export type Performance = {
  athleteId: string;
  role: Localized;
  result?: Localized;
  highlight: Localized;
  stats: { label: Localized; value: string }[];
  communityAvg: ScoreMap;
  ratingCount: number;
};

export type MatchEvent = {
  id: string;
  slug: string;
  sport: Sport;
  title: Localized;
  subtitle: Localized;
  venue: Localized;
  startAt: string;
  status: EventStatus;
  summary: Localized;
  cover: string;
  performances: Performance[];
};

export type SeedComment = {
  id: string;
  eventId: string;
  athleteId: string;
  author: string;
  body: Localized;
  createdAt: string;
  scores?: ScoreMap;
};

export type UserComment = {
  id: string;
  eventId: string;
  athleteId: string;
  author: string;
  body: string;
  createdAt: string;
  scores?: ScoreMap;
  local: true;
};

export type UserRating = {
  eventId: string;
  athleteId: string;
  scores: ScoreMap;
  updatedAt: string;
};
