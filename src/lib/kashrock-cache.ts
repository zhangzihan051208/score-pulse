import type { KrMatch } from "@/lib/kashrock";

type Entry = { at: number; matches: KrMatch[] };

const listBySport = new Map<string, Entry>();
const STALE_MS = 120_000;

export function rememberKrList(krSport: string, matches: KrMatch[]) {
  if (matches.length === 0) return;
  listBySport.set(krSport, { at: Date.now(), matches });
}

export function staleKrList(krSport: string): KrMatch[] | null {
  const hit = listBySport.get(krSport);
  if (!hit) return null;
  if (Date.now() - hit.at > STALE_MS) return null;
  return hit.matches;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
