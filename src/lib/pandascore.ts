import { blockUpstream, PANDASCORE_BUDGET, takeUpstreamSlot } from "@/lib/upstream-budget";

const BASE = "https://api.pandascore.co";

export function isPandaScoreConfigured() {
  return Boolean(process.env.PANDASCORE_API_TOKEN?.trim());
}

function token() {
  return process.env.PANDASCORE_API_TOKEN?.trim() ?? "";
}

export type PsPlayer = {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  role?: string;
  active?: boolean;
};

export type PsOpponent = {
  type?: string;
  opponent?: {
    id?: number;
    name?: string;
    acronym?: string;
    image_url?: string;
    players?: PsPlayer[];
  };
};

export type PsMatch = {
  id: number;
  slug?: string;
  name?: string;
  status?: string;
  scheduled_at?: string;
  begin_at?: string;
  end_at?: string;
  number_of_games?: number;
  match_type?: string;
  videogame?: { slug?: string; name?: string };
  league?: { name?: string };
  serie?: { full_name?: string; name?: string };
  tournament?: { name?: string };
  opponents?: PsOpponent[];
  results?: { score?: number; team_id?: number }[];
  winner_id?: number | null;
};

type ListResponse = PsMatch[];

const staleMatchCache = new Map<string, PsMatch[]>();

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function psFetchOnce(path: string): Promise<{ status: number; data: ListResponse }> {
  if (!isPandaScoreConfigured()) return { status: 0, data: [] };
  if (!takeUpstreamSlot("pandascore", PANDASCORE_BUDGET)) return { status: 0, data: [] };
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}per_page=36&page=1`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    cache: "no-store",
  });
  if (res.status === 429) {
    blockUpstream("pandascore", PANDASCORE_BUDGET, 15 * 60_000);
    return { status: 429, data: [] };
  }
  if (!res.ok) return { status: res.status, data: [] };
  const json = (await res.json()) as ListResponse | { error?: string };
  if (!Array.isArray(json)) return { status: res.status, data: [] };
  return { status: res.status, data: json };
}

async function psFetch(path: string): Promise<ListResponse> {
  const { data } = await psFetchOnce(path);
  return data;
}

export async function fetchEsportsMatches(apiPrefix: string): Promise<PsMatch[]> {
  const byId = new Map<number, PsMatch>();
  const paths = [
    `/${apiPrefix}/matches/running`,
    `/${apiPrefix}/matches/upcoming`,
    `/${apiPrefix}/matches/past`,
  ];

  for (const path of paths) {
    const chunk = await psFetch(path);
    for (const m of chunk) {
      if (m?.id) byId.set(m.id, m);
    }
    if (byId.size >= 36) break;
    await sleep(120);
  }

  const result = [...byId.values()];
  if (result.length > 0) {
    staleMatchCache.set(apiPrefix, result);
    return result;
  }
  return staleMatchCache.get(apiPrefix) ?? [];
}

/** Match detail — generic path works on fixtures-tier tokens (`/{game}/matches/{id}` often 403). */
export async function fetchEsportsMatchById(
  _apiPrefix: string,
  id: number,
): Promise<PsMatch | null> {
  if (!isPandaScoreConfigured()) return null;
  if (!takeUpstreamSlot("pandascore", PANDASCORE_BUDGET)) return null;
  const res = await fetch(`${BASE}/matches/${id}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    cache: "no-store",
  });
  if (res.status === 429) {
    blockUpstream("pandascore", PANDASCORE_BUDGET, 15 * 60_000);
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json()) as PsMatch | { error?: string };
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  return data as PsMatch;
}

/** @deprecated Use fetchPandaTeamPlayersResolved from pandascore-teams.ts */
export async function fetchPandaTeamPlayers(teamId: number): Promise<PsPlayer[]> {
  const { fetchPandaTeamPlayersResolved } = await import("@/lib/pandascore-teams");
  const players = await fetchPandaTeamPlayersResolved(teamId);
  return players ?? [];
}
