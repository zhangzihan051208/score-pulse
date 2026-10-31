export const LOCALES = ["en", "zh", "es", "ja", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized = Record<Locale, string>;

export const SPORTS = ["nba", "soccer", "esports", "nfl", "f1", "tennis", "ufc"] as const;
export type Sport = (typeof SPORTS)[number];

export type EventStatus = "live" | "upcoming" | "ended";

export type ScoreMap = Record<string, number>;

import type { PositionKey as PositionKeyType } from "./position-ratings";
export type PositionKey = PositionKeyType;

export type Athlete = {
  id: string;
  name: string;
  shortName: string;
  country: Localized;
  team?: string;
  /** TheSportsDB team id — for home/away grouping */
  idTeam?: string;
  photoUrl?: string;
  jerseyNumber?: string;
};

export type FavoriteTeam = {
  id: string;
  name: string;
  badgeUrl?: string;
};

export type UserEngagement = {
  commentCount: number;
  likesReceived: number;
  level: number;
  levelTitleKey: "rookie" | "regular" | "analyst" | "veteran" | "legend";
  points: number;
  nextLevelAt: number | null;
};

export type FavoritePair = {
  primary?: FavoriteTeam;
  secondary?: FavoriteTeam;
};

export type FavoritePartition = string;

export type FavoriteTeamsMap = Record<FavoritePartition, FavoritePair>;

export type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  favoriteTeams: FavoriteTeamsMap;
  hidePrimaryCrest: boolean;
  vipUntil: string | null;
  isVip: boolean;
  onboardingCompletedAt: string | null;
  updatedAt: string | null;
};

export type VipQuota = {
  isVip: boolean;
  vipUntil: string | null;
  fullRatingsToday: number;
  fullRatingsLimit: number;
  fullRatingsRemaining: number;
  canFullDimensions: boolean;
};

export type Performance = {
  athleteId: string;
  positionKey: PositionKey;
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
  leagueId?: string;
  leagueSlug?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogoUrl?: string;
  awayTeamLogoUrl?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Raw status from TheSportsDB e.g. FT, NS, 1H */
  statusDetail?: string;
  title: Localized;
  subtitle: Localized;
  venue: Localized;
  startAt: string;
  status: EventStatus;
  summary: Localized;
  cover: string;
  performances: Performance[];
  /** Live TheSportsDB roster keyed by player id */
  roster?: Record<string, Athlete>;
  live?: boolean;
  /** ready = players loaded; loading = still fetching; missing = provider returned none */
  lineupState?: "ready" | "loading" | "missing";
};

export type SeedComment = {
  id: string;
  eventId: string;
  athleteId: string;
  author: string;
  body: Localized;
  createdAt: string;
  scores?: ScoreMap;
  primaryCrestUrl?: string;
  primaryCrestName?: string;
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
