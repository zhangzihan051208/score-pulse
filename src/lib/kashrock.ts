import { rememberKrList, sleep, staleKrList } from "@/lib/kashrock-cache";
import { normalizeKrMatch, type RawKrMatchInput } from "@/lib/kashrock-normalize";

const BASE = "https://kashrock.up.railway.app";

export function isKashRockConfigured() {
  return Boolean(process.env.KASHROCK_API_KEY?.trim());
}

function apiKey() {
  return process.env.KASHROCK_API_KEY?.trim() ?? "";
}

export type KrPlayerBoardPlayer = {
  nickname?: string;
  real_name?: string;
  icon_url?: string;
  role?: string;
  kd?: number;
  adr?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
};

export type KrPlayerBoardTeam = {
  team?: string;
  players?: KrPlayerBoardPlayer[];
};

export type KrMatch = {
  kr_match_id: string;
  slug?: string;
  status?: string;
  event_time?: string;
  team1?: string;
  team2?: string;
  team1_id?: string;
  team2_id?: string;
  team1_logo?: string | null;
  team2_logo?: string | null;
  team1_country?: string | null;
  team2_country?: string | null;
  score1?: number | null;
  score2?: number | null;
  competition?: string;
  stage_name?: string;
  lan?: boolean;
  metadata?: {
    number_of_games?: number;
    scheduled_at?: string;
    begin_at?: string;
  };
  include?: {
    player_board?: {
      available?: boolean;
      teams?: KrPlayerBoardTeam[];
    };
  };
};

type MatchesResponse = {
  available?: boolean;
  sport?: string;
  total?: number;
  matches?: KrMatch[];
};

async function krFetch(path: string): Promise<MatchesResponse | null> {
  if (!isKashRockConfigured()) return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey(),
      },
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as MatchesResponse;
    }
    if (res.status === 429 && attempt < 2) {
      let waitMs = 1500 * (attempt + 1);
      try {
        const body = (await res.json()) as {
          error?: { resets_in_seconds?: number };
        };
        const sec = body.error?.resets_in_seconds;
        if (sec != null && sec > 0) waitMs = Math.min(sec * 1000 + 200, 8000);
      } catch {
        /* ignore */
      }
      await sleep(waitMs);
      continue;
    }
    return null;
  }
  return null;
}

/** KashRock sport slug matches our game tabs (cs2, lol, dota2, valorant). */
export async function fetchKashRockMatches(
  krSport: string,
  limit = 36,
): Promise<KrMatch[]> {
  const data = await krFetch(`/v7/${krSport}/matches?limit=${limit}`);
  const raw = data?.matches ?? [];
  if (raw.length > 0) {
    const matches = raw.map((m) => normalizeKrMatch(m as RawKrMatchInput));
    rememberKrList(krSport, matches);
    return matches;
  }
  const stale = staleKrList(krSport);
  if (stale) return stale.slice(0, limit);
  return [];
}

export function kashRockMatchId(gameSlug: string, tail: string): string {
  if (tail.startsWith("kr_")) return tail;
  return `kr_${gameSlug}_${tail}`;
}

export async function fetchKashRockMatchDetail(
  krSport: string,
  krMatchId: string,
): Promise<KrMatch | null> {
  const id = encodeURIComponent(krMatchId);
  const data = await krFetch(
    `/v7/${krSport}/matches?ids=${id}&include=player_board`,
  );
  const raw = data?.matches?.[0];
  return raw ? normalizeKrMatch(raw as RawKrMatchInput) : null;
}
