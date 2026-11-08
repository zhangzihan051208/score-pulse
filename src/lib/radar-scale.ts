import type { ScoreMap } from "@/lib/types";

/**
 * Grandstand radar standard (matchup videos, Nov 2026).
 *
 * 1. Radius depends only on the raw score (0–10), through a fixed power curve.
 *    It is NOT centred on each player's own mean.
 * 2. In a head-to-head matchup, the gap between the two players on each axis
 *    is widened by MATCHUP_STRETCH around their midpoint before the curve is applied.
 *    Single-player radars use the curve alone (stretch = 1).
 * 3. Labels always show the raw scores, never the stretched values.
 */

/** Exponent of the radius curve. */
export const RADAR_POWER = 1.85;
/** How much the gap between two players is widened per axis (1 = no widening). */
export const MATCHUP_STRETCH = 1.6;
/** Stretched scores are clamped to this range before the curve. */
export const STRETCH_MIN = 0.5;
export const STRETCH_MAX = 10;

/** Grid rings, in raw-score terms. The dashed ring is 6. */
export const RADAR_GRID_SCORES = [3, 6, 9] as const;
export const RADAR_DASHED_SCORE = 6;

/**
 * Raw score (0–10) → radar radius (0–10, where 10 is the outer frame).
 * 0 or an invalid score sits at the centre.
 *   3 → 1.08   6 → 3.89   9 → 8.23   10 → 10
 */
export function scoreToRadarUnit(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const clamped = Math.min(10, raw);
  return 10 * Math.pow(clamped / 10, RADAR_POWER);
}

/**
 * Matchup radius for one player on one axis.
 * mid = (own + opponent) / 2; stretched = mid + (own − mid) × MATCHUP_STRETCH,
 * clamped to [STRETCH_MIN, STRETCH_MAX], then passed through the power curve.
 */
export function matchupRadarUnit(
  own: number,
  opponent: number,
  stretch: number = MATCHUP_STRETCH,
): number {
  if (!Number.isFinite(own) || own <= 0) return 0;
  if (!Number.isFinite(opponent) || opponent <= 0) return scoreToRadarUnit(own);
  const mid = (own + opponent) / 2;
  const stretched = Math.min(
    STRETCH_MAX,
    Math.max(STRETCH_MIN, mid + (own - mid) * stretch),
  );
  return scoreToRadarUnit(stretched);
}

/** Radar radii for one series (single-player view). */
export function radarDisplayValues(scores: ScoreMap, dimIds: string[]): number[] {
  return dimIds.map((id) => scoreToRadarUnit(scores[id] ?? 0));
}

/** Radar radii for both players of a matchup, axis by axis. */
export function matchupRadarValues(
  home: ScoreMap,
  away: ScoreMap,
  dimIds: string[],
  stretch: number = MATCHUP_STRETCH,
): { home: number[]; away: number[] } {
  return {
    home: dimIds.map((id) => matchupRadarUnit(home[id] ?? 0, away[id] ?? 0, stretch)),
    away: dimIds.map((id) => matchupRadarUnit(away[id] ?? 0, home[id] ?? 0, stretch)),
  };
}

/** Radius of a grid ring drawn at a raw score (3, 6 or 9). */
export function gridRingUnit(score: number): number {
  return scoreToRadarUnit(score);
}
