import pack from "@/lib/curated/nfo-mci-20261107.json";
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

const data = pack as unknown as {
  eventId: string;
  crests: Record<string, string>;
  players: PlayerRow[];
  playerTakes: PlayerTake[];
  matchTakes: MatchTake[];
};

export const NFO_MCI_EVENT_ID = data.eventId;

function fold(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function crest(club: string | null) {
  if (!club) return null;
  const url = data.crests[club];
  if (!url) return null;
  return { url, name: club };
}

const playerByName = new Map(data.players.map((player) => [fold(player.name), player]));

export function curatedPositionKey(
  eventId: string,
  playerName: string,
): PositionKey | undefined {
  if (eventId !== data.eventId) return undefined;
  return playerByName.get(fold(playerName))?.positionKey;
}

export function curatedExtraPlayers(eventId: string): PlayerRow[] {
  if (eventId !== data.eventId) return [];
  return data.players.filter((player) => player.extra);
}

export function curatedPlayerTakes(eventId: string, athleteId: string): CommunityTake[] {
  if (eventId !== data.eventId) return [];
  return data.playerTakes
    .filter((take) => take.athleteId === athleteId)
    .map((take) => {
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
    });
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
  if (eventId !== data.eventId) return [];
  return data.matchTakes.map((take) => {
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
