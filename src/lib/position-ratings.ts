import type { Sport } from "./types";

export type PositionKey =
  | "nba.guard"
  | "nba.forward"
  | "nba.center"
  | "soccer.striker"
  | "soccer.winger"
  | "soccer.midfielder"
  | "soccer.fullback"
  | "soccer.centerback"
  | "soccer.keeper"
  | "nfl.quarterback"
  | "nfl.running_back"
  | "nfl.receiver"
  | "f1.driver"
  | "tennis.player"
  | "ufc.striker"
  | "ufc.grappler";

export type PositionProfile = {
  sport: Sport;
  dimensions: readonly string[];
  weights: Record<string, number>;
};

function profile(
  sport: Sport,
  dimensions: string[],
  weights: Record<string, number>,
): PositionProfile {
  const sum = dimensions.reduce((acc, id) => acc + (weights[id] ?? 0), 0);
  const normalized =
    Math.abs(sum - 1) < 0.001
      ? weights
      : Object.fromEntries(
          dimensions.map((id) => [id, (weights[id] ?? 0) / sum]),
        );
  return { sport, dimensions, weights: normalized };
}

export const POSITION_PROFILES: Record<PositionKey, PositionProfile> = {
  "nba.guard": profile("nba", ["scoring", "playmaking", "perimeter_def", "hustle", "clutch"], {
    scoring: 0.3,
    playmaking: 0.25,
    perimeter_def: 0.15,
    hustle: 0.15,
    clutch: 0.15,
  }),
  "nba.forward": profile("nba", ["scoring", "defense", "rebounding", "versatility", "clutch"], {
    scoring: 0.28,
    defense: 0.22,
    rebounding: 0.18,
    versatility: 0.17,
    clutch: 0.15,
  }),
  "nba.center": profile("nba", ["finishing", "rebounding", "rim_def", "interior", "screening"], {
    finishing: 0.22,
    rebounding: 0.25,
    rim_def: 0.25,
    interior: 0.18,
    screening: 0.1,
  }),
  "soccer.striker": profile(
    "soccer",
    ["finishing", "movement", "linkup", "pressing", "composure"],
    {
      finishing: 0.35,
      movement: 0.15,
      linkup: 0.15,
      pressing: 0.15,
      composure: 0.2,
    },
  ),
  "soccer.winger": profile(
    "soccer",
    ["dribbling", "crossing", "finishing", "tracking", "decision"],
    {
      dribbling: 0.25,
      crossing: 0.2,
      finishing: 0.2,
      tracking: 0.2,
      decision: 0.15,
    },
  ),
  "soccer.midfielder": profile(
    "soccer",
    ["passing", "vision", "defending", "stamina", "tempo"],
    {
      passing: 0.25,
      vision: 0.25,
      defending: 0.2,
      stamina: 0.15,
      tempo: 0.15,
    },
  ),
  "soccer.fullback": profile(
    "soccer",
    ["defending", "overlap", "delivery", "pace", "focus"],
    {
      defending: 0.3,
      overlap: 0.2,
      delivery: 0.15,
      pace: 0.2,
      focus: 0.15,
    },
  ),
  "soccer.centerback": profile(
    "soccer",
    ["aerial", "tackling", "positioning", "buildup", "composure"],
    {
      aerial: 0.2,
      tackling: 0.25,
      positioning: 0.3,
      buildup: 0.1,
      composure: 0.15,
    },
  ),
  "soccer.keeper": profile(
    "soccer",
    ["saves", "reflexes", "distribution", "command", "positioning"],
    {
      saves: 0.3,
      reflexes: 0.25,
      distribution: 0.15,
      command: 0.15,
      positioning: 0.15,
    },
  ),
  "nfl.quarterback": profile(
    "nfl",
    ["passing", "decisions", "pocket", "mobility", "clutch"],
    {
      passing: 0.3,
      decisions: 0.25,
      pocket: 0.15,
      mobility: 0.15,
      clutch: 0.15,
    },
  ),
  "nfl.running_back": profile(
    "nfl",
    ["rushing", "receiving", "blocking", "vision", "ball_security"],
    {
      rushing: 0.35,
      receiving: 0.2,
      blocking: 0.15,
      vision: 0.15,
      ball_security: 0.15,
    },
  ),
  "nfl.receiver": profile(
    "nfl",
    ["route", "catching", "separation", "contested", "yards_after"],
    {
      route: 0.25,
      catching: 0.25,
      separation: 0.2,
      contested: 0.15,
      yards_after: 0.15,
    },
  ),
  "f1.driver": profile("f1", ["pace", "racecraft", "tyres", "consistency", "wet"], {
    pace: 0.3,
    racecraft: 0.25,
    tyres: 0.2,
    consistency: 0.15,
    wet: 0.1,
  }),
  "tennis.player": profile(
    "tennis",
    ["serve", "return", "groundstrokes", "movement", "mental"],
    {
      serve: 0.2,
      return: 0.2,
      groundstrokes: 0.25,
      movement: 0.2,
      mental: 0.15,
    },
  ),
  "ufc.striker": profile(
    "ufc",
    ["striking", "power", "defense", "cardio", "composure"],
    {
      striking: 0.35,
      power: 0.2,
      defense: 0.15,
      cardio: 0.15,
      composure: 0.15,
    },
  ),
  "ufc.grappler": profile(
    "ufc",
    ["grappling", "control", "transitions", "cardio", "composure"],
    {
      grappling: 0.35,
      control: 0.25,
      transitions: 0.15,
      cardio: 0.15,
      composure: 0.1,
    },
  ),
};

export const BOARD_POSITIONS: Record<Sport, PositionKey[]> = {
  nba: ["nba.guard", "nba.forward", "nba.center"],
  soccer: [
    "soccer.striker",
    "soccer.winger",
    "soccer.midfielder",
    "soccer.fullback",
    "soccer.centerback",
    "soccer.keeper",
  ],
  nfl: ["nfl.quarterback", "nfl.running_back", "nfl.receiver"],
  f1: ["f1.driver"],
  tennis: ["tennis.player"],
  ufc: ["ufc.striker", "ufc.grappler"],
};

export function getPositionProfile(key: PositionKey): PositionProfile {
  return POSITION_PROFILES[key];
}

export function dimensionIds(key: PositionKey): readonly string[] {
  return POSITION_PROFILES[key].dimensions;
}

export function emptyScoresForPosition(key: PositionKey): Record<string, number> {
  return Object.fromEntries(dimensionIds(key).map((id) => [id, 7]));
}

/** Weighted overall (0–10), one decimal. */
export function weightedOverall(
  scores: Record<string, number>,
  key: PositionKey,
): number {
  const { dimensions, weights } = POSITION_PROFILES[key];
  let total = 0;
  for (const id of dimensions) {
    total += (scores[id] ?? 7) * (weights[id] ?? 0);
  }
  return Math.round(total * 10) / 10;
}
