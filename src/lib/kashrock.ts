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
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey(),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as MatchesResponse;
}

/** KashRock sport slug matches our game tabs (cs2, lol, dota2, valorant). */
export async function fetchKashRockMatches(
  krSport: string,
  limit = 36,
): Promise<KrMatch[]> {
  const data = await krFetch(`/v7/${krSport}/matches?limit=${limit}`);
  return data?.matches ?? [];
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
  return data?.matches?.[0] ?? null;
}
