import type { PositionKey } from "@/lib/position-ratings";
import type { ScoreMap, Sport } from "@/lib/types";

export type Trait =
  | "leader"
  | "big-game"
  | "diva"
  | "iron"
  | "flash"
  | "quiet"
  | "heel"
  | "loyal";

export type Bilingual = { en: string; zh: string };

export type HonorPlayer = {
  id: string;
  name: string;
  team: string;
  /** Honor-board club id, when the club is on the team list. */
  clubId?: string;
  country: string;
  sport: Sport;
  positionKey: PositionKey;
  trait: Trait;
  /** 1 is the top of the honor list. */
  prestige: number;
  honors: Bilingual;
  hook: Bilingual;
  scores: ScoreMap;
  /** Virtual matches in the rolling average. Higher = slower to move. */
  seedWeight: number;
  era: "active" | "legend";
};

export type HonorTeam = {
  id: string;
  name: string;
  sport: Sport;
  league: string;
  trait: Trait;
  prestige: number;
  honors: Bilingual;
  hook: Bilingual;
  /** Sport-level five axes from SPORT_DIMENSIONS. */
  scores: ScoreMap;
  seedWeight: number;
};

export type FanTake = Bilingual & { id: string };

export type ReputationCard = {
  id: string;
  name: string;
  sport: Sport;
  subtitle: string;
  positionKey?: PositionKey;
  trait: Trait;
  rank: number;
  honors: Bilingual;
  scores: ScoreMap;
  dimIds: string[];
  overall: number;
  seedWeight: number;
  matchSamples: number;
  takes: FanTake[];
  era?: "active" | "legend";
  href?: string;
};
