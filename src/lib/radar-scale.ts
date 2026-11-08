import type { ScoreMap } from "@/lib/types";

/**
 * Raw 0–10 scores map onto the radar with a fixed power curve.
 * A flat 3 and a flat 9 used to land on the same ring, because each chart
 * was centered on that player's own average. Radius now follows the score:
 * 3 stays near the middle, 9 reaches the outer ring.
 */
export const RADAR_POWER = 1.85;
export const RADAR_MIN = 0;
export const RADAR_MAX = 10;

/** Score rings drawn under the polygon: low, typical, high. */
export const RADAR_RING_SCORES = [3, 6, 9] as const;

export function scoreToRadarUnit(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return RADAR_MIN;
  const clamped = Math.min(10, raw);
  const unit = 10 * Math.pow(clamped / 10, RADAR_POWER);
  return Math.min(RADAR_MAX, Math.max(RADAR_MIN, unit));
}

export const RADAR_GRID_LEVELS = RADAR_RING_SCORES.map((score) => scoreToRadarUnit(score));
/** The middle ring is a score of 6, not a player's own average. */
export const RADAR_REFERENCE_UNIT = scoreToRadarUnit(6);

export function radarDisplayValues(scores: ScoreMap, dimIds: string[]): number[] {
  return dimIds.map((id) => scoreToRadarUnit(scores[id] ?? 0));
}
