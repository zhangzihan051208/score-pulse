import type { PsMatch, PsPlayer } from "@/lib/pandascore";
import { isPandaScoreConfigured } from "@/lib/pandascore";

const BASE = "https://api.pandascore.co";

function token() {
  return process.env.PANDASCORE_API_TOKEN?.trim() ?? "";
}

const VG_TO_PREFIX: Record<string, string> = {
  "league-of-legends": "lol",
  lol: "lol",
  "cs-go": "csgo",
  csgo: "csgo",
  "counter-strike": "csgo",
  "dota-2": "dota2",
  dota2: "dota2",
  valorant: "valorant",
};

export function apiPrefixForMatch(match: PsMatch, fallback: string): string {
  const slug = match.videogame?.slug?.toLowerCase();
  if (slug && VG_TO_PREFIX[slug]) return VG_TO_PREFIX[slug];
  return fallback;
}

function pickPlayers(raw: PsPlayer[]): PsPlayer[] {
  const active = raw.filter((p) => p.active !== false && p.name?.trim());
  return active.length > 0 ? active : raw.filter((p) => p.name?.trim());
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchTeamJson(path: string): Promise<{ ok: boolean; status: number; players?: PsPlayer[] }> {
  if (!isPandaScoreConfigured()) return { ok: false, status: 0 };
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    cache: "no-store",
  });
  if (res.status === 429) return { ok: false, status: 429 };
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as { players?: PsPlayer[]; error?: string };
  if (data.error) return { ok: false, status: 400 };
  return { ok: true, status: 200, players: data.players ?? [] };
}

/**
 * @returns null when rate-limited after retries — do not treat as empty roster.
 */
export async function fetchPandaTeamPlayersResolved(
  teamId: number,
  apiPrefix?: string,
): Promise<PsPlayer[] | null> {
  if (!teamId) return [];

  const prefixes = [
    ...new Set(
      [apiPrefix, "csgo", "lol", "dota2", "valorant"].filter(Boolean) as string[],
    ),
  ];
  const paths = [`/teams/${teamId}`, ...prefixes.map((p) => `/${p}/teams/${teamId}`)];

  for (let attempt = 0; attempt < 5; attempt++) {
    let saw429 = false;
    for (const path of paths) {
      const hit = await fetchTeamJson(path);
      if (hit.status === 429) {
        saw429 = true;
        continue;
      }
      if (hit.ok) {
        const picked = pickPlayers(hit.players ?? []);
        if (picked.length > 0) return picked;
      }
    }
    if (saw429) {
      await sleep(500 * (attempt + 1));
      continue;
    }
    return [];
  }

  return null;
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}
