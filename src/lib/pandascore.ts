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

async function psFetch(path: string): Promise<ListResponse> {
  if (!isPandaScoreConfigured()) return [];
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}per_page=50&page=1`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    next: { revalidate: 45 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as ListResponse | { error?: string };
  if (!Array.isArray(data)) return [];
  return data;
}

export async function fetchEsportsMatches(apiPrefix: string): Promise<PsMatch[]> {
  const [upcoming, running, past] = await Promise.all([
    psFetch(`/${apiPrefix}/matches/upcoming`),
    psFetch(`/${apiPrefix}/matches/running`),
    psFetch(`/${apiPrefix}/matches/past`),
  ]);
  const byId = new Map<number, PsMatch>();
  for (const m of [...running, ...upcoming, ...past]) {
    if (m?.id) byId.set(m.id, m);
  }
  return [...byId.values()];
}

/** Match detail — generic path works on fixtures-tier tokens (`/{game}/matches/{id}` often 403). */
export async function fetchEsportsMatchById(
  _apiPrefix: string,
  id: number,
): Promise<PsMatch | null> {
  if (!isPandaScoreConfigured()) return null;
  const res = await fetch(`${BASE}/matches/${id}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as PsMatch | { error?: string };
  if (!data || typeof data !== "object" || !("id" in data)) return null;
  return data as PsMatch;
}

export async function fetchPandaTeamPlayers(teamId: number): Promise<PsPlayer[]> {
  if (!isPandaScoreConfigured() || !teamId) return [];
  const res = await fetch(`${BASE}/teams/${teamId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token()}`,
    },
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { players?: PsPlayer[] };
  const players = data.players ?? [];
  const active = players.filter((p) => p.active !== false);
  return active.length > 0 ? active : players;
}
