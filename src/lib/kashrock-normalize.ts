import type { KrMatch, KrPlayerBoardPlayer, KrPlayerBoardTeam } from "@/lib/kashrock";

type KrMapPlayer = {
  nickname?: string;
  player_name?: string;
  team?: string;
  kills?: number;
  deaths?: number;
  adr?: number;
  assists?: number;
  icon_url?: string;
  weapon?: string;
  role?: string;
};

type KrMapSlice = {
  status?: string;
  state?: string;
  map_number?: number;
  players?: KrMapPlayer[];
};

export type RawKrMatchInput = KrMatch & {
  match_id?: string;
  start_date?: string;
  team1_score?: number | null;
  team2_score?: number | null;
  bo_type?: number;
  maps?: KrMapSlice[];
};

function pickMapWithPlayers(maps: KrMapSlice[]): KrMapSlice | undefined {
  const withPlayers = maps.filter((m) => (m.players?.length ?? 0) > 0);
  if (withPlayers.length === 0) return undefined;

  const live = withPlayers.filter(
    (m) => m.status === "current" || m.state === "current" || m.status === "live",
  );
  if (live.length > 0) {
    return live.sort((a, b) => (b.map_number ?? 0) - (a.map_number ?? 0))[0];
  }

  return withPlayers.sort((a, b) => (b.map_number ?? 0) - (a.map_number ?? 0))[0];
}

function mapPlayerToBoard(p: KrMapPlayer): KrPlayerBoardPlayer {
  const kills = p.kills ?? undefined;
  const deaths = p.deaths ?? undefined;
  const kd =
    kills != null && deaths != null && deaths > 0
      ? kills / deaths
      : kills != null && deaths === 0
        ? kills
        : undefined;

  return {
    nickname: p.nickname?.trim() || p.player_name?.trim(),
    real_name: p.player_name?.trim(),
    icon_url: p.icon_url,
    role: p.role?.trim() || p.weapon?.trim(),
    kd,
    adr: p.adr,
    kills,
    deaths,
    assists: p.assists,
  };
}

/** Build player_board teams from embedded map stats (CS2 live box scores). */
export function playerBoardTeamsFromMaps(
  match: Pick<RawKrMatchInput, "maps">,
): KrPlayerBoardTeam[] | undefined {
  const maps = match.maps;
  if (!maps?.length) return undefined;

  const slice = pickMapWithPlayers(maps);
  const players = slice?.players;
  if (!players?.length) return undefined;

  const byTeam = new Map<string, KrPlayerBoardPlayer[]>();
  for (const p of players) {
    const team = p.team?.trim();
    const nick = p.nickname?.trim() || p.player_name?.trim();
    if (!team || !nick) continue;
    const list = byTeam.get(team) ?? [];
    list.push(mapPlayerToBoard(p));
    byTeam.set(team, list);
  }

  if (byTeam.size === 0) return undefined;
  return [...byTeam.entries()].map(([team, roster]) => ({ team, players: roster }));
}

export function normalizeKrMatch(raw: RawKrMatchInput): KrMatch {
  const kr_match_id =
    raw.kr_match_id?.trim() ||
    raw.match_id?.trim() ||
    "";

  const score1 = raw.score1 ?? raw.team1_score ?? null;
  const score2 = raw.score2 ?? raw.team2_score ?? null;
  const event_time =
    raw.event_time ??
    raw.start_date ??
    raw.metadata?.begin_at ??
    raw.metadata?.scheduled_at;

  const bo = raw.metadata?.number_of_games ?? raw.bo_type;

  const boardFromInclude = raw.include?.player_board?.teams;
  const boardFromMaps = playerBoardTeamsFromMaps(raw);
  const teams =
    boardFromInclude && boardFromInclude.length > 0
      ? boardFromInclude
      : boardFromMaps;

  const player_board =
    teams && teams.length > 0
      ? { available: true, teams }
      : raw.include?.player_board;

  return {
    kr_match_id,
    slug: raw.slug,
    status: raw.status,
    event_time,
    team1: raw.team1,
    team2: raw.team2,
    team1_id: raw.team1_id,
    team2_id: raw.team2_id,
    team1_logo: raw.team1_logo,
    team2_logo: raw.team2_logo,
    team1_country: raw.team1_country,
    team2_country: raw.team2_country,
    score1,
    score2,
    competition: raw.competition,
    stage_name: raw.stage_name,
    lan: raw.lan ?? undefined,
    metadata: {
      ...raw.metadata,
      number_of_games: bo ?? raw.metadata?.number_of_games,
      begin_at: raw.metadata?.begin_at ?? raw.start_date,
      scheduled_at: raw.metadata?.scheduled_at ?? raw.start_date,
    },
    include: player_board ? { player_board } : raw.include,
  };
}

export function krMatchHasPlayerData(match: KrMatch): boolean {
  const teams = match.include?.player_board?.teams;
  return Boolean(teams && teams.length > 0);
}

/** Prefer fresher scores/status from detail while keeping list map rosters. */
export function mergeKrMatches(base: KrMatch, detail: KrMatch): KrMatch {
  const baseTeams = base.include?.player_board?.teams;
  const detailTeams = detail.include?.player_board?.teams;
  const teams =
    detailTeams && detailTeams.length > 0
      ? detailTeams
      : baseTeams && baseTeams.length > 0
        ? baseTeams
        : undefined;

  return {
    ...base,
    ...detail,
    kr_match_id: detail.kr_match_id || base.kr_match_id,
    slug: detail.slug ?? base.slug,
    status: detail.status ?? base.status,
    event_time: detail.event_time ?? base.event_time,
    team1: detail.team1 ?? base.team1,
    team2: detail.team2 ?? base.team2,
    team1_id: detail.team1_id ?? base.team1_id,
    team2_id: detail.team2_id ?? base.team2_id,
    team1_logo: detail.team1_logo ?? base.team1_logo,
    team2_logo: detail.team2_logo ?? base.team2_logo,
    team1_country: detail.team1_country ?? base.team1_country,
    team2_country: detail.team2_country ?? base.team2_country,
    score1: detail.score1 ?? base.score1,
    score2: detail.score2 ?? base.score2,
    competition: detail.competition ?? base.competition,
    stage_name: detail.stage_name ?? base.stage_name,
    metadata: { ...base.metadata, ...detail.metadata },
    include: teams?.length
      ? { player_board: { available: true, teams } }
      : (detail.include ?? base.include),
  };
}
