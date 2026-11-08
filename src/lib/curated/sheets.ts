import forestPack from "@/lib/curated/nfo-mci-20261107.json";
import top5Pack from "@/lib/curated/top5-20261106.json";
import uclPack from "@/lib/curated/ucl-20261103.json";
import nbaPack from "@/lib/curated/nba-20261104.json";
import muaAvlPack from "@/lib/curated/mua-avl-20261108.json";
import type { CommunityTake } from "@/lib/community-take-types";
import type { PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";

type PlayerRow = {
  athleteId: string;
  name: string;
  team: string;
  positionKey: PositionKey;
  extra: boolean;
};

type PlayerTake = {
  id: string;
  athleteId: string;
  author: string;
  club: string | null;
  body: string;
  scores: ScoreMap;
  at: string;
};

type MatchTake = {
  id: string;
  author: string;
  club: string | null;
  body: string;
  score: number;
  at: string;
};

type EventSheet = {
  players: PlayerRow[];
  playerTakes: PlayerTake[];
  matchTakes: MatchTake[];
};

const forest = forestPack as unknown as {
  eventId: string;
  crests: Record<string, string>;
  players: PlayerRow[];
  playerTakes: PlayerTake[];
  matchTakes: MatchTake[];
};

const top5 = top5Pack as unknown as {
  crests: Record<string, string>;
  events: Record<string, EventSheet>;
};

const ucl = uclPack as unknown as {
  crests: Record<string, string>;
  events: Record<string, EventSheet>;
};

const nba = nbaPack as unknown as {
  crests: Record<string, string>;
  events: Record<string, EventSheet>;
};

const muaAvl = muaAvlPack as unknown as {
  crests: Record<string, string>;
  events: Record<string, EventSheet>;
};

const crests: Record<string, string> = {
  ...forest.crests,
  ...top5.crests,
  ...ucl.crests,
  ...nba.crests,
  ...muaAvl.crests,
};

const events = new Map<string, EventSheet>([
  [
    forest.eventId,
    {
      players: forest.players,
      playerTakes: forest.playerTakes,
      matchTakes: forest.matchTakes,
    },
  ],
  ...Object.entries(top5.events),
  ...Object.entries(ucl.events),
  ...Object.entries(nba.events),
  ...Object.entries(muaAvl.events),
]);

export const NFO_MCI_EVENT_ID = forest.eventId;

/** Matches that already have fan ratings. Sync must not drop these as they age. */
export const PERMANENT_RATED_EVENT_IDS: ReadonlySet<string> = new Set(
  [...events.entries()]
    .filter(([, sheet]) => sheet.playerTakes.length > 0 || sheet.matchTakes.length > 0)
    .map(([eventId]) => eventId),
);

function fold(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function crest(club: string | null) {
  if (!club) return null;
  const url = crests[club];
  if (!url) return null;
  return { url, name: club };
}

function eventPlayers(eventId: string) {
  return events.get(eventId)?.players ?? [];
}

export function curatedPositionKey(
  eventId: string,
  playerName: string,
): PositionKey | undefined {
  const folded = fold(playerName);
  return eventPlayers(eventId).find((player) => fold(player.name) === folded)?.positionKey;
}

export function curatedExtraPlayers(eventId: string): PlayerRow[] {
  return eventPlayers(eventId).filter((player) => player.extra);
}

function toCommunityTake(take: PlayerTake): CommunityTake {
  const badge = crest(take.club);
  return {
    userId: take.id,
    author: take.author,
    scores: take.scores,
    updatedAt: take.at,
    body: take.body,
    isYou: false,
    primaryCrestUrl: badge?.url ?? null,
    primaryCrestName: badge?.name ?? null,
    editorial: true,
  };
}

export function curatedTakesByAthlete(eventId: string): Record<string, CommunityTake[]> {
  const sheet = events.get(eventId);
  if (!sheet) return {};
  const grouped: Record<string, CommunityTake[]> = {};
  for (const take of sheet.playerTakes) {
    const list = grouped[take.athleteId] ?? [];
    list.push(toCommunityTake(take));
    grouped[take.athleteId] = list;
  }
  return grouped;
}

export function curatedPlayerTakes(eventId: string, athleteId: string): CommunityTake[] {
  return curatedTakesByAthlete(eventId)[athleteId] ?? [];
}

export type CuratedMatchTake = {
  userId: string;
  author: string;
  score: number;
  body: string;
  createdAt: string;
  isYou: false;
  primaryCrestUrl: string | null;
  primaryCrestName: string | null;
  editorial: true;
};

export function curatedMatchTakes(eventId: string): CuratedMatchTake[] {
  const sheet = events.get(eventId);
  if (!sheet) return [];
  return sheet.matchTakes.map((take) => {
    const badge = crest(take.club);
    return {
      userId: take.id,
      author: take.author,
      score: take.score,
      body: take.body,
      createdAt: take.at,
      isYou: false,
      primaryCrestUrl: badge?.url ?? null,
      primaryCrestName: badge?.name ?? null,
      editorial: true,
    };
  });
}
