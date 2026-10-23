import { dimensionIds, type PositionKey } from "@/lib/position-ratings";
import { SPORT_DIMENSIONS } from "@/lib/sports";
import type { Sport, ScoreMap } from "@/lib/types";
import type { HonorPlayer, HonorTeam, Trait } from "./types";

export function player(row: {
  id: string;
  name: string;
  team: string;
  clubId?: string;
  country: string;
  sport: Sport;
  pos: PositionKey;
  trait: Trait;
  prestige: number;
  honorEn: string;
  honorZh: string;
  hookEn: string;
  hookZh: string;
  axes: number[];
  weight?: number;
  era?: "active" | "legend";
}): HonorPlayer {
  const ids = dimensionIds(row.pos);
  if (ids.length !== row.axes.length) {
    throw new Error(`${row.id} expected ${ids.length} axes for ${row.pos}`);
  }
  return {
    id: row.id,
    name: row.name,
    team: row.team,
    clubId: row.clubId,
    country: row.country,
    sport: row.sport,
    positionKey: row.pos,
    trait: row.trait,
    prestige: row.prestige,
    honors: { en: row.honorEn, zh: row.honorZh },
    hook: { en: row.hookEn, zh: row.hookZh },
    scores: Object.fromEntries(ids.map((id, i) => [id, row.axes[i]!])) as ScoreMap,
    seedWeight: row.weight ?? 10,
    era: row.era ?? "active",
  };
}

export function team(row: {
  id: string;
  name: string;
  sport: Sport;
  league: string;
  trait: Trait;
  prestige: number;
  honorEn: string;
  honorZh: string;
  hookEn: string;
  hookZh: string;
  axes: number[];
  weight?: number;
}): HonorTeam {
  const dims = SPORT_DIMENSIONS[row.sport];
  if (dims.length !== row.axes.length) {
    throw new Error(`${row.id} axes`);
  }
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    league: row.league,
    trait: row.trait,
    prestige: row.prestige,
    honors: { en: row.honorEn, zh: row.honorZh },
    hook: { en: row.hookEn, zh: row.hookZh },
    scores: Object.fromEntries(dims.map((id, i) => [id, row.axes[i]!])),
    seedWeight: row.weight ?? 12,
  };
}
