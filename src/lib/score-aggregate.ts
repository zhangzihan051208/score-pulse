import type { ScoreMap } from "@/lib/types";

export function averageScores(
  rows: ScoreMap[],
  dimIds: string[],
): ScoreMap | null {
  if (rows.length === 0) return null;
  const avg: ScoreMap = {};
  for (const id of dimIds) {
    const sum = rows.reduce((acc, row) => acc + (row[id] ?? 0), 0);
    avg[id] = Number((sum / rows.length).toFixed(1));
  }
  return avg;
}
