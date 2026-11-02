/** Soccer and basketball stay open. Other sport boards are paused. */
export const OPEN_SPORTS = ["nba", "soccer"] as const;

/** DIY rating zones (food, gear, and the rest) are paused. */
export const ZONES_ENABLED = false;

export function isSportOpen(sport: string): boolean {
  return (OPEN_SPORTS as readonly string[]).includes(sport);
}
