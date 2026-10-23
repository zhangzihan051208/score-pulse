import { SPORT_DIMENSIONS } from "@/lib/sports";
import { dimensionIds, weightedOverall, type PositionKey } from "@/lib/position-ratings";
import { meanScore } from "@/lib/score-display";
import type { ScoreMap, Sport } from "@/lib/types";

/** Position axis → club axis, so a match card can move a team radar. */
const TO_SPORT: Record<PositionKey, Record<string, string>> = {
  "soccer.striker": {
    finishing: "attack",
    movement: "workrate",
    linkup: "creation",
    pressing: "defending",
    composure: "composure",
  },
  "soccer.winger": {
    dribbling: "attack",
    crossing: "creation",
    finishing: "attack",
    tracking: "workrate",
    decision: "composure",
  },
  "soccer.midfielder": {
    passing: "creation",
    vision: "creation",
    defending: "defending",
    stamina: "workrate",
    tempo: "attack",
  },
  "soccer.fullback": {
    defending: "defending",
    overlap: "attack",
    delivery: "creation",
    pace: "workrate",
    focus: "composure",
  },
  "soccer.centerback": {
    aerial: "defending",
    tackling: "defending",
    positioning: "composure",
    buildup: "creation",
    composure: "composure",
  },
  "soccer.keeper": {
    saves: "defending",
    reflexes: "workrate",
    distribution: "creation",
    command: "composure",
    positioning: "defending",
  },
  "nba.guard": {
    scoring: "scoring",
    playmaking: "playmaking",
    perimeter_def: "defense",
    hustle: "hustle",
    clutch: "clutch",
  },
  "nba.forward": {
    scoring: "scoring",
    defense: "defense",
    rebounding: "hustle",
    versatility: "playmaking",
    clutch: "clutch",
  },
  "nba.center": {
    scoring: "scoring",
    rebounding: "hustle",
    rim_def: "defense",
    interior: "defense",
    screening: "playmaking",
  },
  "nfl.quarterback": {
    passing: "execution",
    decisions: "awareness",
    pocket: "consistency",
    mobility: "physicality",
    clutch: "clutch",
  },
  "nfl.running_back": {
    rushing: "execution",
    receiving: "execution",
    blocking: "physicality",
    vision: "awareness",
    ball_security: "consistency",
  },
  "nfl.receiver": {
    route: "awareness",
    catching: "execution",
    separation: "execution",
    contested: "physicality",
    yards_after: "clutch",
  },
  "f1.driver": {
    pace: "pace",
    racecraft: "racecraft",
    tyres: "tyres",
    consistency: "consistency",
    wet: "composure",
  },
  "tennis.player": {
    serve: "serve",
    return: "return",
    groundstrokes: "rally",
    movement: "movement",
    mental: "clutch",
  },
  "esports.player": {
    mechanics: "mechanics",
    macro: "macro",
    impact: "impact",
    consistency: "consistency",
    clutch: "clutch",
  },
  "ufc.striker": {
    striking: "striking",
    power: "striking",
    defense: "control",
    cardio: "cardio",
    composure: "composure",
  },
  "ufc.grappler": {
    grappling: "grappling",
    control: "control",
    transitions: "grappling",
    cardio: "cardio",
    composure: "composure",
  },
};

export function projectToSport(
  positionKey: PositionKey,
  scores: ScoreMap,
  sport: Sport,
): ScoreMap {
  const dims = SPORT_DIMENSIONS[sport];
  const map = TO_SPORT[positionKey];
  const buckets = new Map<string, number[]>();
  for (const [from, to] of Object.entries(map)) {
    const value = scores[from];
    if (value == null || !dims.includes(to)) continue;
    const list = buckets.get(to) ?? [];
    list.push(value);
    buckets.set(to, list);
  }
  const out: ScoreMap = {};
  for (const dim of dims) {
    const list = buckets.get(dim);
    if (!list?.length) continue;
    out[dim] = round1(list.reduce((a, b) => a + b, 0) / list.length);
  }
  return out;
}

export function blendScores(
  base: ScoreMap,
  baseWeight: number,
  samples: ScoreMap[],
  dims: readonly string[],
): ScoreMap {
  const out: ScoreMap = {};
  for (const dim of dims) {
    const seed = base[dim];
    if (seed == null) continue;
    let weight = baseWeight;
    let sum = seed * baseWeight;
    for (const sample of samples) {
      const value = sample[dim];
      if (value == null) continue;
      sum += value;
      weight += 1;
    }
    out[dim] = round1(sum / weight);
  }
  return out;
}

export function playerOverall(scores: ScoreMap, positionKey: PositionKey): number {
  return round1(weightedOverall(scores, positionKey));
}

export function teamOverall(scores: ScoreMap, sport: Sport): number {
  const dims = SPORT_DIMENSIONS[sport];
  const slice: ScoreMap = {};
  for (const dim of dims) {
    if (scores[dim] != null) slice[dim] = scores[dim]!;
  }
  return round1(meanScore(slice));
}

export function playerDimIds(positionKey: PositionKey): string[] {
  return [...dimensionIds(positionKey)];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
