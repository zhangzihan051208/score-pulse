import type { ScoreMap } from "@/lib/types";

/** Internal 0–10 ring position where the baseline mean sits. */
export const RADAR_CENTER = 5.5;
/** How far each +1 raw point moves on the radar (exaggeration). */
export const RADAR_GAIN = 3;
export const RADAR_MIN = 0.8;
export const RADAR_MAX = 9.8;

/** Grid rings on the internal scale (below / at / above baseline). */
export const RADAR_GRID_LEVELS = [2.8, 5.5, 8.2] as const;

export function meanDimensionScore(scores: ScoreMap, dimIds: string[]): number {
  if (dimIds.length === 0) return 7;
  const vals = dimIds.map((id) => scores[id] ?? 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function scoreToRadarUnit(raw: number, baselineMean: number): number {
  const centered = RADAR_CENTER + (raw - baselineMean) * RADAR_GAIN;
  return Math.min(RADAR_MAX, Math.max(RADAR_MIN, centered));
}

export function radarDisplayValues(
  scores: ScoreMap,
  dimIds: string[],
  baselineMean: number,
): number[] {
  return dimIds.map((id) => scoreToRadarUnit(scores[id] ?? 0, baselineMean));
}

/** Prefer explicit baseline; else mean of the first series (community avg when listed first). */
export function resolveRadarBaseline(
  dimIds: string[],
  series: { scores: ScoreMap }[],
  explicit?: number,
): number {
  if (explicit != null && Number.isFinite(explicit)) return explicit;
  if (series.length === 0) return 7;
  return meanDimensionScore(series[0]!.scores, dimIds);
}
