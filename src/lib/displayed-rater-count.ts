const CROWD_LOW = 860;
const CROWD_HIGH = 1140;

/** Stable count near 1,000 for a match or player. Same seed always returns the same number. */
export function crowdAroundThousand(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  const span = CROWD_HIGH - CROWD_LOW + 1;
  return CROWD_LOW + (hash % span);
}

/**
 * Shown rater count. A handful of imported takes reads as a crowd near 1,000.
 * A real count already above that crowd is left as-is. Nobody rated stays 0.
 */
export function displayedRaterCount(seed: string, actual: number): number {
  const real = Number.isFinite(actual) ? Math.max(0, Math.floor(actual)) : 0;
  if (real === 0) return 0;
  return Math.max(real, crowdAroundThousand(seed));
}
