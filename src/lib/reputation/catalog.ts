import { events } from "@/lib/data";
import { SPORT_DIMENSIONS } from "@/lib/sports";
import { SPORTS, type ScoreMap, type Sport } from "@/lib/types";
import { activePlayers as seededActivePlayers } from "./active";
import {
  blendScores,
  playerDimIds,
  playerOverall,
  projectToSport,
  teamOverall,
} from "./blend";
import { extraActivePlayers } from "./extra-players";
import { extraLegendPlayers } from "./extra-legends";
import { extraHonorTeams } from "./extra-teams";
import { legendPlayers as seededLegendPlayers } from "./legends";
import { honorTeams as seededHonorTeams } from "./teams";
import { applyFc26 } from "./fc26";
import { applySoccer2026, soccer2026Players } from "./soccer-2026";
import { portraitFor } from "./portraits";
import type { HonorPlayer, HonorTeam, ReputationCard } from "./types";
import { fanTakes } from "./voice";

export const activePlayers: HonorPlayer[] = [
  ...seededActivePlayers,
  ...extraActivePlayers,
  ...soccer2026Players,
];
export const legendPlayers: HonorPlayer[] = [
  ...seededLegendPlayers,
  ...extraLegendPlayers,
];
export const honorTeams: HonorTeam[] = [...seededHonorTeams, ...extraHonorTeams];

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

function rankWithinSport<T extends { sport: Sport; prestige: number }>(rows: T[]) {
  const grouped = new Map<Sport, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.sport) ?? [];
    list.push(row);
    grouped.set(row.sport, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.prestige - b.prestige || a.sport.localeCompare(b.sport));
    list.forEach((row, index) => {
      row.prestige = index + 1;
    });
  }
}

applyFc26(activePlayers);
applySoccer2026(activePlayers);
rankWithinSport(activePlayers.filter((person) => !person.offBoard));
rankWithinSport(legendPlayers);
rankWithinSport(honorTeams);

function assertBoards() {
  const ids = new Set<string>();
  for (const person of [...activePlayers, ...legendPlayers]) {
    const key = `${person.era}:${person.sport}:${person.id}`;
    if (ids.has(key)) throw new Error(`duplicate ${key}`);
    ids.add(key);
  }
  const teamIds = new Set(honorTeams.map((club) => club.id));
  if (teamIds.size !== honorTeams.length) throw new Error("duplicate team ids");
  for (const sport of SPORTS) {
    const active = activePlayers.filter((person) => person.sport === sport && !person.offBoard).length;
    const clubs = honorTeams.filter((club) => club.sport === sport).length;
    const legends = legendPlayers.filter((person) => person.sport === sport).length;
    if (active !== 100) throw new Error(`${sport} active board is ${active}, expected 100`);
    if (clubs !== 50) throw new Error(`${sport} team board is ${clubs}, expected 50`);
    if (legends < 20) throw new Error(`${sport} legends board is ${legends}, expected at least 20`);
  }
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
  return activePlayers
    .filter((p) => p.clubId === clubId)
    .sort(
      (a, b) =>
        (b.fcRating ?? 0) - (a.fcRating ?? 0) ||
        a.prestige - b.prestige ||
        a.name.localeCompare(b.name),
    );
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
  opts?: { withTakes?: boolean },
): ReputationCard {
  const dimIds = playerDimIds(person.positionKey);
  const samples = [...seedMatchSamples(person.id), ...extraSamples];
  const scores = blendScores(person.scores, person.seedWeight, samples, dimIds);
  return {
    id: person.id,
    name: person.name,
    sport: person.sport,
    subtitle: [person.team, person.kitNumber ? `#${person.kitNumber}` : null, person.country]
      .filter(Boolean)
      .join(" · "),
    positionKey: person.positionKey,
    trait: person.trait,
    rank: person.prestige,
    offBoard: person.offBoard,
    roleOrder: person.roleOrder,
    honors: person.honors,
    scores,
    dimIds,
    overall: person.fcRating ?? playerOverall(scores, person.positionKey),
    overallDigits: person.fcRating != null ? 0 : undefined,
    kitNumber: person.kitNumber,
    seedWeight: person.seedWeight,
    matchSamples: samples.length,
    takes:
      opts?.withTakes === false
        ? []
        : fanTakes({
            id: person.id,
            scores,
            hook: person.hook,
            trait: person.trait,
            scope: person.positionKey,
          }),
    era: person.era,
    href: `/players/${person.sport}/${person.id}`,
    photoUrl: portraitFor(person.sport, person.id),
  };
}

export function presentTeam(
  club: HonorTeam,
  extraSamples: ScoreMap[] = [],
  opts?: { withTakes?: boolean },
): ReputationCard {
  const dimIds = [...SPORT_DIMENSIONS[club.sport]];
  const samples = [...clubMatchSamples(club), ...extraSamples];
  const scores = blendScores(club.scores, club.seedWeight, samples, dimIds);
  const href = `/teams/honor-${club.id}?sport=${club.sport}&name=${encodeURIComponent(club.name)}`;
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
    takes:
      opts?.withTakes === false
        ? []
        : fanTakes({
            id: club.id,
            scores,
            hook: club.hook,
            trait: club.trait,
            scope: club.sport,
          }),
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
  const sports = want ? [want] : [...SPORTS];
  if (kind === "teams") {
    return sports.flatMap((boardSport) =>
      honorTeams
        .filter((club) => club.sport === boardSport)
        .sort((a, b) => a.prestige - b.prestige)
        .map((club, index) => ({
          ...presentTeam(club, extraById?.get(club.id) ?? [], { withTakes: false }),
          rank: index + 1,
        })),
    );
  }
  const source = kind === "legends" ? legendPlayers : activePlayers;
  return sports.flatMap((boardSport) =>
    source
      .filter((person) => person.sport === boardSport && (!person.offBoard || person.roleOrder))
      .sort(
        (a, b) =>
          Number(Boolean(a.offBoard)) - Number(Boolean(b.offBoard)) ||
          a.prestige - b.prestige ||
          (a.roleOrder ?? 99) - (b.roleOrder ?? 99),
      )
      .map((person, index) => ({
          ...presentPlayer(person, extraById?.get(person.id) ?? [], { withTakes: false }),
        rank: index + 1,
      })),
  );
}

