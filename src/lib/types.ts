export const SPORTS = [
  "badminton",
  "basketball",
  "football",
  "table-tennis",
  "athletics",
] as const;

export type Sport = (typeof SPORTS)[number];

export type EventStatus = "live" | "upcoming" | "ended";

export type DimensionId =
  | "technique"
  | "tactics"
  | "fitness"
  | "mentality"
  | "overall";

export type ScoreMap = Record<DimensionId, number>;

export type Athlete = {
  id: string;
  name: string;
  shortName: string;
  country: string;
  team?: string;
};

export type Performance = {
  athleteId: string;
  role: string;
  seed?: number;
  result?: string;
  highlight: string;
  stats: { label: string; value: string }[];
  communityAvg: ScoreMap;
  ratingCount: number;
};

export type MatchEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  sport: Sport;
  venue: string;
  startAt: string;
  status: EventStatus;
  summary: string;
  cover: string;
  performances: Performance[];
};

export type SeedComment = {
  id: string;
  eventId: string;
  athleteId: string;
  author: string;
  body: string;
  createdAt: string;
  scores?: Partial<ScoreMap>;
};

export type UserComment = SeedComment & { local: true };

export type UserRating = {
  eventId: string;
  athleteId: string;
  scores: ScoreMap;
  updatedAt: string;
};
