import { events } from "@/lib/data";
import { SPORT_DIMENSIONS } from "@/lib/sports";
import type { ScoreMap, Sport } from "@/lib/types";
import { activePlayers } from "./active";
import {
  blendScores,
  playerDimIds,
  playerOverall,
  projectToSport,
  teamOverall,
} from "./blend";
import { legendPlayers } from "./legends";
import { honorTeams } from "./teams";
import type { HonorPlayer, HonorTeam, ReputationCard } from "./types";
import { fanTakes } from "./voice";

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const players = [...activePlayers, ...legendPlayers];

const playerById = new Map(players.map((p) => [`${p.sport}:${p.id}`, p]));
const playersByName = new Map<string, HonorPlayer[]>();
for (const p of players) {
  const key = `${p.sport}:${norm(p.name)}`;
  playersByName.set(key, [...(playersByName.get(key) ?? []), p]);
}

const teamById = new Map(honorTeams.map((t) => [t.id, t]));
const teamByName = new Map<string, HonorTeam>();
for (const t of honorTeams) {
  teamByName.set(`${t.sport}:${norm(t.name)}`, t);
}

function assertBoards() {
  if (activePlayers.length !== 100) {
    throw new Error(`active board is ${activePlayers.length}, expected 100`);
  }
  if (honorTeams.length !== 50) {
    throw new Error(`team board is ${honorTeams.length}, expected 50`);
  }
  const ids = new Set(activePlayers.map((p) => p.id));
  if (ids.size !== activePlayers.length) throw new Error("duplicate active ids");
  const prestige = new Set(activePlayers.map((p) => p.prestige));
  if (prestige.size !== activePlayers.length) throw new Error("duplicate active prestige");
  const teamIds = new Set(honorTeams.map((t) => t.id));
  if (teamIds.size !== honorTeams.length) throw new Error("duplicate team ids");
}

assertBoards();

export function findHonorPlayer(sport: Sport, idOrName: string): HonorPlayer | undefined {
  const direct = playerById.get(`${sport}:${idOrName}`);
  if (direct) return direct;
  const named = playersByName.get(`${sport}:${norm(idOrName)}`);
  return named?.[0];
}

const TEAM_ALIAS: Record<string, string> = {
  bayernmunchen: "bayern",
  bayernmunich: "bayern",
  fcbayern: "bayern",
  fcbayernmunchen: "bayern",
  fcbarcelona: "barcelona",
  barca: "barcelona",
  realmadrid: "realmadrid",
  realmadridcf: "realmadrid",
  manchestercity: "mancity",
  mancity: "mancity",
  paris: "psg",
  parissaintgermain: "psg",
  psg: "psg",
  liverpoolfc: "liverpool",
  arsenal: "arsenal",
  arsenalfc: "arsenal",
  chelseafc: "chelsea",
  manchesterunited: "manunited",
  manutd: "manunited",
  atleticomadrid: "atletico",
  atletico: "atletico",
  intermilan: "inter",
  internazionale: "inter",
  fcinternazionale: "inter",
  juventus: "juventus",
  acmilan: "milan",
  borussiadortmund: "dortmund",
  napoli: "napoli",
  tottenhamhotspur: "tottenham",
  tottenham: "tottenham",
  losangeleslakers: "lakers",
  lalakers: "lakers",
  bostonceltics: "celtics",
  goldenstatewarriors: "warriors",
  chicagobulls: "bulls",
  sanantoniospurs: "spurs",
  miamiheat: "heat",
  milwaukeebucks: "bucks",
  denvernuggets: "nuggets",
  newyorkknicks: "knicks",
  dallasmavericks: "mavs",
  oklahomacitythunder: "thunder",
};

export function findHonorTeam(sport: Sport, idOrName: string): HonorTeam | undefined {
  const raw = idOrName.startsWith("honor-") ? idOrName.slice("honor-".length) : idOrName;
  const byId = teamById.get(raw);
  if (byId && byId.sport === sport) return byId;
  const named = teamByName.get(`${sport}:${norm(raw)}`);
  if (named) return named;
  const alias = TEAM_ALIAS[norm(raw)];
  const aliased = alias ? teamById.get(alias) : undefined;
  if (aliased && aliased.sport === sport) return aliased;
  return byId?.sport === sport ? byId : undefined;
}

export function playersOnClub(clubId: string): HonorPlayer[] {
  return activePlayers.filter((p) => p.clubId === clubId);
}

export function seedMatchSamples(athleteId: string): ScoreMap[] {
  const out: ScoreMap[] = [];
  for (const event of events) {
    const perf = event.performances.find((p) => p.athleteId === athleteId);
    if (perf) out.push(perf.communityAvg);
  }
  return out;
}

function averageMaps(samples: ScoreMap[], dims: readonly string[]): ScoreMap | null {
  if (!samples.length) return null;
  const out: ScoreMap = {};
  for (const dim of dims) {
    const values = samples
      .map((s) => s[dim])
      .filter((n): n is number => typeof n === "number");
    if (!values.length) continue;
    out[dim] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
  return Object.keys(out).length ? out : null;
}

export function clubMatchSamples(team: HonorTeam): ScoreMap[] {
  const dims = SPORT_DIMENSIONS[team.sport];
  const out: ScoreMap[] = [];
  for (const event of events) {
    if (event.sport !== team.sport) continue;
    const projected: ScoreMap[] = [];
    for (const perf of event.performances) {
      const athlete = playerById.get(`${team.sport}:${perf.athleteId}`);
      if (!athlete || athlete.clubId !== team.id) continue;
      projected.push(projectToSport(athlete.positionKey, perf.communityAvg, team.sport));
    }
    const avg = averageMaps(projected, dims);
    if (avg) out.push(avg);
  }
  return out;
}

export function presentPlayer(
  person: HonorPlayer,
  extraSamples: ScoreMap[] = [],
): ReputationCard {
  const dimIds = playerDimIds(person.positionKey);
  const samples = [...seedMatchSamples(person.id), ...extraSamples];
  const scores = blendScores(person.scores, person.seedWeight, samples, dimIds);
  return {
    id: person.id,
    name: person.name,
    sport: person.sport,
    subtitle: [person.team, person.country].filter(Boolean).join(" · "),
    positionKey: person.positionKey,
    trait: person.trait,
    rank: person.prestige,
    honors: person.honors,
    scores,
    dimIds,
    overall: playerOverall(scores, person.positionKey),
    seedWeight: person.seedWeight,
    matchSamples: samples.length,
    takes: fanTakes({ id: person.id, scores, hook: person.hook, trait: person.trait }),
    era: person.era,
    href: `/players/${person.sport}/${person.id}`,
  };
}

export function presentTeam(
  club: HonorTeam,
  extraSamples: ScoreMap[] = [],
): ReputationCard {
  const dimIds = [...SPORT_DIMENSIONS[club.sport]];
  const samples = [...clubMatchSamples(club), ...extraSamples];
  const scores = blendScores(club.scores, club.seedWeight, samples, dimIds);
  const href =
    club.sport === "soccer" || club.sport === "nba"
      ? `/teams/honor-${club.id}?sport=${club.sport}&name=${encodeURIComponent(club.name)}`
      : undefined;
  return {
    id: club.id,
    name: club.name,
    sport: club.sport,
    subtitle: club.league,
    trait: club.trait,
    rank: club.prestige,
    honors: club.honors,
    scores,
    dimIds,
    overall: teamOverall(scores, club.sport),
    seedWeight: club.seedWeight,
    matchSamples: samples.length,
    takes: fanTakes({ id: club.id, scores, hook: club.hook, trait: club.trait }),
    href,
  };
}

export type HonorBoardKind = "players" | "teams" | "legends";

export function honorBoard(
  kind: HonorBoardKind,
  sport?: Sport | "all",
  extraById?: Map<string, ScoreMap[]>,
): ReputationCard[] {
  const want = !sport || sport === "all" ? null : sport;
  if (kind === "teams") {
    const rows = honorTeams
      .filter((t) => !want || t.sport === want)
      .sort((a, b) => a.prestige - b.prestige);
    return rows.map((t, i) => ({
      ...presentTeam(t, extraById?.get(t.id) ?? []),
      rank: i + 1,
    }));
  }
  const source = kind === "legends" ? legendPlayers : activePlayers;
  const rows = source
    .filter((p) => !want || p.sport === want)
    .sort((a, b) => a.prestige - b.prestige);
  return rows.map((p, i) => ({
    ...presentPlayer(p, extraById?.get(p.id) ?? []),
    rank: i + 1,
  }));
}

export { activePlayers, legendPlayers, honorTeams };
