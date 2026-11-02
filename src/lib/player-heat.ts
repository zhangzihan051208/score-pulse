import { activePlayers, findHonorPlayer } from "@/lib/reputation/catalog";
import type { HonorPlayer } from "@/lib/reputation/types";
import type { Sport } from "@/lib/types";

/**
 * Popularity from the current honor ranking.
 * Rank 1 is 100. Anyone outside the active hundred is 0.
 * Computed when a lineup is read. Not stored.
 */
const RANKED_SPORTS = new Set<Sport>(["nba", "soccer"]);

/** Letters that do not decompose to ASCII under NFD, so "Odegaard" still meets "Ødegaard". */
function fold(value: string): string {
  return value
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .replace(/ł/gi, "l")
    .replace(/đ/gi, "d")
    .replace(/ð/gi, "d")
    .replace(/þ/gi, "th")
    .replace(/ß/g, "ss");
}

function normTokens(value: string): string[] {
  return fold(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function onBoard(person: HonorPlayer | undefined): person is HonorPlayer {
  return Boolean(
    person &&
      person.era !== "legend" &&
      !person.offBoard &&
      person.prestige >= 1 &&
      person.prestige <= 100,
  );
}

const rankedBySport = new Map<Sport, HonorPlayer[]>();
for (const person of activePlayers) {
  if (!onBoard(person) || !RANKED_SPORTS.has(person.sport)) continue;
  const list = rankedBySport.get(person.sport) ?? [];
  list.push(person);
  rankedBySport.set(person.sport, list);
}

const NAME_PARTICLES = new Set([
  "al",
  "bin",
  "da",
  "de",
  "del",
  "della",
  "den",
  "der",
  "di",
  "do",
  "dos",
  "du",
  "la",
  "le",
  "st",
  "van",
  "von",
]);

function substantive(tokens: string[]): string[] {
  const core = tokens.filter((token) => !NAME_PARTICLES.has(token));
  return core.length > 0 ? core : tokens;
}

/**
 * How safely a lineup name belongs to a ranked player. 0 means no.
 * A one-word ranking name can take one extra surname ("Alisson" → "Alisson Becker")
 * but not a different player's full legal name ("Alisson de Almeida Santos").
 */
function nameScore(lineup: string[], ranked: string[]): number {
  if (lineup.length === 0 || ranked.length === 0) return 0;
  const rankedSet = new Set(ranked);
  if (lineup.length === ranked.length && lineup.every((token) => rankedSet.has(token))) {
    return 100;
  }
  const lineCore = substantive(lineup);
  const rankCore = substantive(ranked);
  if (lineCore.length === 0 || rankCore.length === 0) return 0;
  if (lineCore.join(" ") === rankCore.join(" ")) return 90;

  const rankSet = new Set(rankCore);
  if (
    lineCore.length >= 2 &&
    lineCore.every((token) => rankSet.has(token)) &&
    lineCore[lineCore.length - 1] === rankCore[rankCore.length - 1]
  ) {
    return 60 + lineCore.length;
  }
  // The feed uses the first name the board uses as the whole name: "Gabriel".
  // A lone surname such as "Pedro" is not enough. Common surnames collide.
  if (lineCore.length === 1 && lineCore[0] === rankCore[0]) return 70;
  if (rankCore.length === 1 && lineCore.length === 2 && lineCore[0] === rankCore[0]) {
    return 55;
  }
  const lineSet = new Set(lineCore);
  if (
    rankCore.length >= 2 &&
    rankCore.every((token) => lineSet.has(token)) &&
    rankCore[rankCore.length - 1] === lineCore[lineCore.length - 1]
  ) {
    return 50 + rankCore.length;
  }
  return 0;
}

const CLUB_ALIAS: Record<string, string> = {
  fcbarcelona: "barcelona",
  barca: "barcelona",
  realmadridcf: "realmadrid",
  manchestercity: "mancity",
  manchesterunited: "manunited",
  manutd: "manunited",
  bayernmunich: "bayern",
  bayernmunchen: "bayern",
  fcbayernmunchen: "bayern",
  fcbayern: "bayern",
  parissaintgermain: "psg",
  paris: "psg",
  tottenhamhotspur: "tottenham",
  atleticomadrid: "atletico",
  atleticodemadrid: "atletico",
  borussiadortmund: "dortmund",
  intermilan: "inter",
  internazionale: "inter",
  fcinternazionale: "inter",
  acmilan: "milan",
  juventusfc: "juventus",
  arsenal: "arsenal",
  arsenalfc: "arsenal",
  chelseafc: "chelsea",
  liverpoolfc: "liverpool",
  newcastleunited: "newcastle",
  westhamunited: "westham",
  wolves: "wolverhamptonwanderers",
};

function clubKey(value: string): string {
  const raw = fold(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return CLUB_ALIAS[raw] ?? raw;
}

/** Fuzzy name hits have to be the same club. Exact full names skip this. */
function clubsAgree(lineupTeam: string | undefined, catalogTeam: string | undefined): boolean {
  if (!lineupTeam || !catalogTeam) return false;
  const a = clubKey(lineupTeam);
  const b = clubKey(catalogTeam);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function matchByName(
  sport: Sport,
  name: string,
  team?: string,
): HonorPlayer | undefined {
  const lineup = normTokens(name);
  if (lineup.length === 0) return undefined;
  let best: HonorPlayer | undefined;
  let bestScore = 0;
  let tied = false;
  for (const person of rankedBySport.get(sport) ?? []) {
    const score = nameScore(lineup, normTokens(person.name));
    if (score < 50) continue;
    if (score < 100 && !clubsAgree(team, person.team)) continue;
    if (score > bestScore) {
      best = person;
      bestScore = score;
      tied = false;
    } else if (score === bestScore && person.id !== best?.id) {
      tied = true;
    }
  }
  if (!best || tied) return undefined;
  return best;
}

export function rankedPlayer(
  sport: Sport,
  nameOrId: string,
  team?: string,
): HonorPlayer | undefined {
  if (!RANKED_SPORTS.has(sport)) return undefined;
  const direct = findHonorPlayer(sport, nameOrId);
  if (onBoard(direct)) return direct;
  return matchByName(sport, nameOrId, team);
}

/** Higher means more famous. Unranked players are 0. */
export function playerHeat(sport: Sport, nameOrId: string, team?: string): number {
  const person = rankedPlayer(sport, nameOrId, team);
  if (!person) return 0;
  return 101 - person.prestige;
}
