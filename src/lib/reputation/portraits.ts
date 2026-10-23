import portraits from "./portraits.json";

const map = portraits as Record<string, string>;

/** Public photo path, or undefined when this player has no cached portrait. */
export function portraitFor(sport: string, id: string): string | undefined {
  return map[`${sport}:${id}`];
}
