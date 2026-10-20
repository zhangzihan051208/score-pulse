import type { ScoreMap } from "@/lib/types";

export function averageScores(
  rows: ScoreMap[],
  dimIds: string[],
): ScoreMap | null {
  if (rows.length === 0) return null;
  return weightedAverageScores(
    rows.map((scores) => ({ scores, weight: 1 })),
    dimIds,
  );
}

export function weightedAverageScores(
  rows: { scores: ScoreMap; weight: number }[],
  dimIds: string[],
): ScoreMap | null {
  const active = rows.filter((r) => r.weight > 0);
  if (active.length === 0) return null;
  const totalWeight = active.reduce((acc, r) => acc + r.weight, 0);
  if (totalWeight <= 0) return null;
  const avg: ScoreMap = {};
  for (const id of dimIds) {
    const sum = active.reduce(
      (acc, row) => acc + (row.scores[id] ?? 0) * row.weight,
      0,
    );
    avg[id] = Number((sum / totalWeight).toFixed(1));
  }
  return avg;
}
