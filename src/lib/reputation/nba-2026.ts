import { events } from "@/lib/data";
import { dimensionIds, getPositionProfile, weightedOverall, type PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";
import { blendScores } from "./blend";
import { player } from "./build";
import type { HonorPlayer } from "./types";

/** ESPN 2026-27 top 50, then the confirmed later slots, with the gaps filled from the same position lists. */
export const NBA_OVERALL = [
  "jokic", "wemby", "sga", "luka", "giannis", "brunson", "edwards", "cade", "tatum", "mitchell",
  "maxey", "curry", "durant", "jbrown", "kawhi", "kat", "scottie", "lebron", "hali", "booker",
  "jamal", "jalenj", "flagg", "chet", "jdub", "mobley", "avdija", "bam", "siakam", "sengun",
  "amen", "harden", "duren", "og", "lamelo", "paolo", "reaves", "castle", "kyrie", "ad",
  "embiid", "gobert", "fox", "trae", "franz", "miller", "dwhite", "knueppel", "markkanen", "harper",
  "zion", "ingram", "butler", "randle", "aarongordon", "jaden", "powell", "vassell", "treymurphy", "mpj",
  "mikal", "garland", "jallen", "barrett", "brooks", "dyson", "pg", "dybantsa", "lillard", "edgecombe",
  "dejounte", "ja", "kessler", "hartenstein", "boozer", "jabari", "claxton", "gafford", "poeltl", "giddey",
  "hield", "poole", "simons", "monk", "grant", "tobias", "kuzma", "buzelis", "valanciunas", "bropez",
  "vanvleet", "bane", "herro", "capela", "clingan", "ayton", "bogdan", "levert", "trentjr", "grayson",
] as const;

export const NBA_ROLES: Record<string, readonly string[]> = {
  "nba.pointguard": [
    "sga", "luka", "cade", "brunson", "maxey", "curry", "hali", "jamal", "harden", "lamelo",
    "fox", "trae", "dwhite", "harper", "kyrie", "lillard", "garland", "giddey", "vanvleet", "dejounte",
  ],
  "nba.shootingguard": [
    "edwards", "mitchell", "booker", "amen", "reaves", "castle", "knueppel", "edgecombe", "pg", "hield",
    "poole", "simons", "monk", "bogdan", "levert", "trentjr", "kennard", "grayson", "bane", "herro",
  ],
  "nba.smallforward": [
    "tatum", "flagg", "jbrown", "jdub", "durant", "kawhi", "avdija", "franz", "ingram", "miller",
    "dybantsa", "powell", "mikal", "treymurphy", "mpj", "vassell", "jaden", "barrett", "brooks", "butler",
  ],
  "nba.powerforward": [
    "giannis", "jalenj", "scottie", "mobley", "lebron", "paolo", "zion", "siakam", "ad", "markkanen",
    "randle", "og", "aarongordon", "boozer", "caleb", "buzelis", "jabari", "grant", "tobias", "kuzma",
  ],
  "nba.center": [
    "kat", "jokic", "wemby", "sengun", "chet", "bam", "duren", "embiid", "gobert", "hartenstein",
    "kessler", "jallen", "clingan", "claxton", "gafford", "poeltl", "valanciunas", "bropez", "capela", "ayton",
  ],
};

const FALLBACK_POS: Record<string, PositionKey> = {
  ja: "nba.pointguard",
  dyson: "nba.smallforward",
};

type Spec = {
  id: string;
  name: string;
  team: string;
  clubId?: string;
  country: string;
  pos: PositionKey;
  zh: string;
  en: string;
};

const ADDED: Spec[] = [
  { id: "flagg", name: "Cooper Flagg", team: "Dallas Mavericks", clubId: "mavs", country: "USA", pos: "nba.smallforward", zh: "独行侠的新锋线，第一步比年纪大", en: "Dallas' new forward, a first step older than his age" },
  { id: "avdija", name: "Deni Avdija", team: "Portland Trail Blazers", country: "Israel", pos: "nba.smallforward", zh: "开拓者的组织前锋", en: "Portland's playmaking forward" },
  { id: "harper", name: "Dylan Harper", team: "San Antonio Spurs", clubId: "spurs", country: "USA", pos: "nba.pointguard", zh: "马刺的新控卫，ESPN 总榜第 50", en: "Spurs' new point guard, ESPN No. 50" },
  { id: "knueppel", name: "Kon Knueppel", team: "Charlotte Hornets", country: "USA", pos: "nba.shootingguard", zh: "黄蜂的射手，HoopsHype 分卫第 7", en: "Hornets shooter, HoopsHype shooting guard No. 7" },
  { id: "edgecombe", name: "VJ Edgecombe", team: "Philadelphia 76ers", country: "Bahamas", pos: "nba.shootingguard", zh: "76 人的新分卫，HoopsHype 第 8", en: "Philadelphia's new two-guard, HoopsHype No. 8" },
  { id: "ingram", name: "Brandon Ingram", team: "Toronto Raptors", country: "USA", pos: "nba.smallforward", zh: "猛龙的侧翼，中距离还在", en: "Toronto's wing, the midrange still employed" },
  { id: "powell", name: "Norman Powell", team: "Los Angeles Clippers", country: "Canada", pos: "nba.smallforward", zh: "快船的无球射手", en: "Clippers' movement shooter" },
  { id: "treymurphy", name: "Trey Murphy III", team: "New Orleans Pelicans", country: "USA", pos: "nba.smallforward", zh: "鹈鹕的底角和空切", en: "New Orleans' corner and the cut" },
  { id: "dybantsa", name: "AJ Dybantsa", team: "Utah Jazz", country: "USA", pos: "nba.smallforward", zh: "爵士的新锋线", en: "Utah's new wing" },
  { id: "brooks", name: "Dillon Brooks", team: "Phoenix Suns", country: "Canada", pos: "nba.smallforward", zh: "太阳的对位，对抗先开口", en: "Phoenix's matchup, the body before the shot" },
  { id: "lillard", name: "Damian Lillard", team: "Milwaukee Bucks", clubId: "bucks", country: "USA", pos: "nba.pointguard", zh: "雄鹿的超远三分，ESPN 总榜第 69", en: "Milwaukee's logo three, ESPN No. 69" },
  { id: "kessler", name: "Walker Kessler", team: "Utah Jazz", country: "USA", pos: "nba.center", zh: "爵士的护框，ESPN 总榜第 73", en: "Utah's rim protector, ESPN No. 73" },
  { id: "jallen", name: "Jarrett Allen", team: "Cleveland Cavaliers", country: "USA", pos: "nba.center", zh: "骑士的篮板和护框，ESPN 总榜第 63", en: "Cleveland's glass and rim, ESPN No. 63" },
  { id: "clingan", name: "Donovan Clingan", team: "Portland Trail Blazers", country: "USA", pos: "nba.center", zh: "开拓者的高度，ESPN 总榜第 95", en: "Portland's size, ESPN No. 95" },
  { id: "claxton", name: "Nic Claxton", team: "Brooklyn Nets", country: "USA", pos: "nba.center", zh: "篮网的护框和换防", en: "Brooklyn's rim and the switch" },
  { id: "gafford", name: "Daniel Gafford", team: "Dallas Mavericks", clubId: "mavs", country: "USA", pos: "nba.center", zh: "独行侠的垂直弹跳", en: "Dallas' vertical spacer" },
  { id: "poeltl", name: "Jakob Poeltl", team: "Toronto Raptors", country: "Austria", pos: "nba.center", zh: "猛龙的策应中锋", en: "Toronto's hub at center" },
  { id: "valanciunas", name: "Jonas Valančiūnas", team: "Denver Nuggets", clubId: "nuggets", country: "Lithuania", pos: "nba.center", zh: "掘金的低位背身", en: "Denver's back-to-the-basket big" },
  { id: "bropez", name: "Brook Lopez", team: "Milwaukee Bucks", clubId: "bucks", country: "USA", pos: "nba.center", zh: "雄鹿的护框和三分", en: "Milwaukee's rim and the three" },
  { id: "capela", name: "Clint Capela", team: "Atlanta Hawks", country: "Switzerland", pos: "nba.center", zh: "老鹰的篮板", en: "Atlanta's glass" },
  { id: "ayton", name: "Deandre Ayton", team: "Los Angeles Lakers", clubId: "lakers", country: "Bahamas", pos: "nba.center", zh: "湖人的内线高度", en: "Lakers' size inside" },
  { id: "hield", name: "Buddy Hield", team: "Golden State Warriors", clubId: "warriors", country: "Bahamas", pos: "nba.shootingguard", zh: "勇士的接球就投", en: "Warriors' catch-and-shoot" },
  { id: "poole", name: "Jordan Poole", team: "Washington Wizards", country: "USA", pos: "nba.shootingguard", zh: "奇才的持球出手", en: "Washington's pull-up" },
  { id: "simons", name: "Anfernee Simons", team: "Portland Trail Blazers", country: "USA", pos: "nba.shootingguard", zh: "开拓者的得分后卫", en: "Portland's scoring guard" },
  { id: "bogdan", name: "Bogdan Bogdanović", team: "Los Angeles Clippers", country: "Serbia", pos: "nba.shootingguard", zh: "快船的侧翼射手", en: "Clippers' wing shooter" },
  { id: "levert", name: "Caris LeVert", team: "Atlanta Hawks", country: "USA", pos: "nba.shootingguard", zh: "老鹰的突破分球", en: "Atlanta's drive and kick" },
  { id: "trentjr", name: "Gary Trent Jr.", team: "Milwaukee Bucks", clubId: "bucks", country: "USA", pos: "nba.shootingguard", zh: "雄鹿的定点三分", en: "Milwaukee's spot-up three" },
  { id: "kennard", name: "Luke Kennard", team: "Memphis Grizzlies", country: "USA", pos: "nba.shootingguard", zh: "灰熊的接球射手", en: "Memphis' relocation shooter" },
  { id: "grayson", name: "Grayson Allen", team: "Phoenix Suns", country: "USA", pos: "nba.shootingguard", zh: "太阳的无球三分", en: "Phoenix' off-ball three" },
  { id: "dejounte", name: "Dejounte Murray", team: "New Orleans Pelicans", country: "USA", pos: "nba.pointguard", zh: "鹈鹕的控卫，上季表现补进前 20", en: "Pelicans' point guard, added from last season's form" },
  { id: "grant", name: "Jerami Grant", team: "Portland Trail Blazers", country: "USA", pos: "nba.powerforward", zh: "开拓者的侧翼大前", en: "Portland's stretch four" },
  { id: "tobias", name: "Tobias Harris", team: "Detroit Pistons", country: "USA", pos: "nba.powerforward", zh: "活塞的经验大前", en: "Detroit's veteran forward" },
  { id: "kuzma", name: "Kyle Kuzma", team: "Milwaukee Bucks", clubId: "bucks", country: "USA", pos: "nba.powerforward", zh: "雄鹿的前场得分", en: "Milwaukee's frontcourt scoring" },
  { id: "buzelis", name: "Matas Buzelis", team: "Chicago Bulls", country: "USA", pos: "nba.powerforward", zh: "公牛的新大前，ESPN 总榜第 88", en: "Chicago's new forward, ESPN No. 88" },
  { id: "boozer", name: "Cameron Boozer", team: "Utah Jazz", country: "USA", pos: "nba.powerforward", zh: "新秀大前，HoopsHype 第 14", en: "Rookie forward, HoopsHype No. 14" },
  { id: "caleb", name: "Caleb Wilson", team: "Washington Wizards", country: "USA", pos: "nba.powerforward", zh: "奇才的年轻大前，HoopsHype 第 15", en: "Wizards' young forward, HoopsHype No. 15" },
];

const ADDED_IDS = new Set(ADDED.map((row) => row.id));

/** Same 10-point bands as the soccer board: packed at the top, then looser. */
export function nbaTarget(rank: number) {
  const bands: readonly [number, number][] = [
    [1, 9.4],
    [3, 9.3],
    [5, 9.2],
    [8, 9.1],
    [12, 9.0],
    [18, 8.8],
    [25, 8.7],
    [34, 8.5],
    [45, 8.3],
    [58, 8.1],
    [70, 7.9],
    [82, 7.7],
    [92, 7.5],
    [100, 7.3],
  ];
  for (const [until, score] of bands) {
    if (rank <= until) return score;
  }
  return 7.3;
}

function roleOnlyTarget(order: number) {
  const raw = 7.15 - Math.pow((order - 1) / 19, 0.8) * 0.55;
  return round1(Math.max(6.6, raw));
}

/** Profiles that contradict the stored axes, or that changed position family. */
const VOICE: Record<string, ScoreMap> = {
  durant: { scoring: 9.6, defense: 7.0, rebounding: 7.6, versatility: 9.2, clutch: 9.0 },
  kawhi: { scoring: 8.8, defense: 9.2, rebounding: 7.4, versatility: 8.4, clutch: 8.6 },
  zion: { scoring: 9.2, defense: 7.2, rebounding: 8.4, versatility: 8.0, clutch: 7.0 },
  butler: { scoring: 8.4, defense: 8.8, rebounding: 7.4, versatility: 8.6, clutch: 9.2 },
  harden: { scoring: 8.4, playmaking: 9.2, perimeter_def: 6.6, hustle: 6.8, clutch: 8.0 },
  trae: { scoring: 8.8, playmaking: 9.2, perimeter_def: 6.2, hustle: 6.8, clutch: 8.4 },
  ja: { scoring: 9.0, playmaking: 8.6, perimeter_def: 6.6, hustle: 8.4, clutch: 7.2 },
  lamelo: { scoring: 8.4, playmaking: 9.2, perimeter_def: 6.4, hustle: 6.6, clutch: 8.0 },
  maxey: { scoring: 9.0, playmaking: 7.4, perimeter_def: 7.2, hustle: 8.4, clutch: 8.2 },
  sengun: { finishing: 8.6, rebounding: 8.4, rim_def: 7.2, interior: 9.1, screening: 8.3 },
  chet: { finishing: 8.2, rebounding: 8.4, rim_def: 9.2, interior: 7.6, screening: 7.8 },
  bam: { finishing: 7.8, rebounding: 8.6, rim_def: 9.0, interior: 8.8, screening: 8.4 },
  amen: { scoring: 7.6, playmaking: 7.4, perimeter_def: 9.2, hustle: 8.8, clutch: 7.8 },
  jalenj: { scoring: 8.4, defense: 7.6, rebounding: 8.6, versatility: 8.8, clutch: 7.6 },
  scottie: { scoring: 7.8, defense: 8.6, rebounding: 8.8, versatility: 8.6, clutch: 7.6 },
  flagg: { scoring: 8.4, defense: 8.6, rebounding: 7.8, versatility: 8.2, clutch: 7.4 },
  lillard: { scoring: 9.0, playmaking: 8.4, perimeter_def: 6.4, hustle: 7.2, clutch: 8.8 },
  jallen: { finishing: 7.6, rebounding: 8.8, rim_def: 8.6, interior: 7.8, screening: 8.2 },
  kessler: { finishing: 7.0, rebounding: 8.6, rim_def: 9.2, interior: 6.8, screening: 8.0 },
  gobert: { finishing: 7.2, rebounding: 9.0, rim_def: 9.4, interior: 6.6, screening: 8.4 },
  embiid: { finishing: 9.3, rebounding: 8.2, rim_def: 8.4, interior: 8.8, screening: 6.6 },
  mpj: { scoring: 9.0, defense: 7.2, rebounding: 8.2, versatility: 6.8, clutch: 7.6 },
  giddey: { scoring: 7.4, playmaking: 8.8, perimeter_def: 6.6, hustle: 7.2, clutch: 7.0 },
  tobias: { scoring: 8.0, defense: 7.2, rebounding: 7.4, versatility: 7.6, clutch: 7.0 },
  kuzma: { scoring: 8.2, defense: 6.6, rebounding: 7.6, versatility: 7.4, clutch: 7.2 },
};

const RELATIVES: Record<string, readonly string[]> = {
  scoring: ["scoring", "finishing"],
  playmaking: ["playmaking", "versatility", "interior"],
  perimeter_def: ["perimeter_def", "defense", "rim_def"],
  hustle: ["hustle", "rebounding", "screening"],
  clutch: ["clutch", "scoring", "finishing"],
  defense: ["defense", "perimeter_def", "rim_def"],
  rebounding: ["rebounding", "hustle"],
  versatility: ["versatility", "playmaking", "interior"],
  finishing: ["finishing", "scoring"],
  rim_def: ["rim_def", "defense", "perimeter_def"],
  interior: ["interior", "versatility", "playmaking"],
  screening: ["screening", "hustle", "versatility", "defense"],
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function hash(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function holeSize(ownSpan: number, target: number) {
  const personality = Math.min(3.4, Math.max(0.8, ownSpan));
  const room = 1.05 + Math.max(0, target - 7) * 0.42;
  const mixed = personality * 0.58 + Math.min(personality, room) * 0.42;
  return Math.min(room + 0.45, Math.max(0.8, mixed));
}

function dropsFrom(source: ScoreMap, dims: readonly string[]) {
  const values = dims.map((dim) => source[dim] ?? 7);
  const best = Math.max(...values);
  const worst = Math.min(...values);
  const span = best - worst;
  if (span < 0.15) return Object.fromEntries(dims.map((dim) => [dim, 0]));
  const scale = span < 0.8 ? 0.35 : 1;
  return Object.fromEntries(dims.map((dim, index) => [dim, ((best - values[index]!) / span) * scale]));
}

function templateDrops(pos: PositionKey, id: string, dims: readonly string[]) {
  const weights = getPositionProfile(pos).weights;
  const salt = hash(id);
  let peak = [...dims].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0))[0]!;
  let holes = [...dims];
  if (pos === "nba.pointguard") {
    peak = salt % 4 === 0 ? "scoring" : "playmaking";
    holes = ["perimeter_def", "hustle"];
  } else if (pos === "nba.shootingguard") {
    peak = "scoring";
    holes = salt % 2 === 0 ? ["playmaking", "perimeter_def"] : ["perimeter_def", "hustle"];
  } else if (pos === "nba.smallforward") {
    peak = salt % 3 === 0 ? "defense" : "scoring";
    holes = peak === "defense" ? ["rebounding", "clutch"] : ["rebounding", "defense"];
  } else if (pos === "nba.powerforward") {
    peak = salt % 2 === 0 ? "rebounding" : "defense";
    holes = ["scoring", "clutch"];
  } else if (pos === "nba.center") {
    peak = salt % 3 === 0 ? "rebounding" : "rim_def";
    holes = ["finishing", "screening"];
  }
  const choices = holes.filter((dim) => dim !== peak && dims.includes(dim));
  const hole = choices[salt % Math.max(1, choices.length)] ?? dims[dims.length - 1]!;
  const rest = dims
    .filter((dim) => dim !== peak && dim !== hole)
    .sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
  if (rest.length >= 2 && salt % 2 === 0) {
    const swap = rest[0]!;
    rest[0] = rest[1]!;
    rest[1] = swap;
  }
  const order = [peak, ...rest, hole];
  const tilt = ((salt % 5) - 2) * 0.05;
  const pattern = [0, Math.max(0.08, 0.18 + tilt), 0.4 - tilt * 0.4, Math.min(0.82, 0.66 + tilt * 0.3), 1];
  return Object.fromEntries(order.map((dim, index) => [dim, pattern[index] ?? 1]));
}

function bridgeScores(scores: ScoreMap, dims: readonly string[]): ScoreMap | null {
  const out: ScoreMap = {};
  for (const dim of dims) {
    const found = (RELATIVES[dim] ?? [dim]).find((key) => typeof scores[key] === "number");
    if (!found) return null;
    out[dim] = scores[found]!;
  }
  return out;
}

function sourceProfile(person: HonorPlayer, dims: readonly string[]): ScoreMap | null {
  const voice = VOICE[person.id];
  if (voice && dims.every((dim) => typeof voice[dim] === "number")) return voice;
  if (!ADDED_IDS.has(person.id) && dims.every((dim) => typeof person.scores[dim] === "number")) {
    const values = dims.map((dim) => person.scores[dim]!);
    const span = Math.max(...values) - Math.min(...values);
    if (span >= 0.3) return Object.fromEntries(dims.map((dim) => [dim, person.scores[dim]!])) as ScoreMap;
  }
  if (!ADDED_IDS.has(person.id)) return bridgeScores(person.scores, dims);
  return null;
}

function weakest(dims: readonly string[], drops: Record<string, number>, weights: Record<string, number>) {
  return dims.reduce((best, dim) => {
    const gap = (drops[dim] ?? 0) - (drops[best] ?? 0);
    if (gap > 0.001) return dim;
    if (gap < -0.001) return best;
    return (weights[dim] ?? 0) < (weights[best] ?? 0) ? dim : best;
  });
}

function shapeToTarget(person: HonorPlayer, target: number): ScoreMap {
  const pos = person.positionKey;
  const dims = dimensionIds(pos);
  const weights = getPositionProfile(pos).weights;
  const source = sourceProfile(person, dims);
  const drops = source ? dropsFrom(source, dims) : templateDrops(pos, person.id, dims);
  const worst = weakest(dims, drops, weights);
  const ownSpan = source
    ? Math.max(...dims.map((dim) => source[dim] ?? 7)) - Math.min(...dims.map((dim) => source[dim] ?? 7))
    : 1.5;
  const hole = holeSize(ownSpan, target);
  const scores: ScoreMap = {};
  const bestLevel = Math.min(9.9, target + Math.min(0.6, hole * 0.42));
  for (const dim of dims) scores[dim] = bestLevel - (drops[dim] ?? 0) * hole;

  for (let pass = 0; pass < 18; pass += 1) {
    const now = weightedOverall(scores, pos);
    const err = target - now;
    if (Math.abs(err) < 0.03) break;
    const raising = err > 0;
    const mag = Math.min(Math.abs(err), 0.22);
    const share = (dim: string) => (dim === worst ? (raising ? 0 : 1.45) : raising ? 1 : 0.6);
    const denom = dims.reduce((sum, dim) => sum + (weights[dim] ?? 0) * share(dim), 0) || 1;
    const step = ((raising ? 1 : -1) * mag) / denom;
    let capped = false;
    for (const dim of dims) {
      const next = scores[dim]! + step * share(dim);
      if (next > 9.9 || next < 4.5) capped = true;
      scores[dim] = Math.min(9.9, Math.max(4.5, next));
    }
    if (!capped || !raising) continue;
    const left = target - weightedOverall(scores, pos);
    if (left <= 0.03) break;
    const room = dims.filter((dim) => dim !== worst && scores[dim]! < 9.89);
    if (room.length) {
      const roomWeight = room.reduce((sum, dim) => sum + (weights[dim] ?? 0), 0) || 1;
      for (const dim of room) scores[dim] = Math.min(9.9, scores[dim]! + left / roomWeight);
      continue;
    }
    const best = Math.max(...dims.filter((dim) => dim !== worst).map((dim) => scores[dim]!));
    const gap = best - scores[worst]!;
    if (gap > 0.75) scores[worst] = Math.min(best - 0.6, scores[worst]! + left / (weights[worst] ?? 0.2));
    break;
  }

  for (const dim of dims) scores[dim] = round1(Math.min(9.9, Math.max(4.5, scores[dim]!)));
  for (let pass = 0; pass < 4; pass += 1) {
    const top = Math.max(...dims.map((dim) => scores[dim]!));
    const tied = dims.filter((dim) => scores[dim]! >= top - 0.001);
    if (tied.length < 2) break;
    const sacrifice = tied.reduce((a, b) => ((drops[a] ?? 0) > (drops[b] ?? 0) ? a : b));
    scores[sacrifice] = round1(scores[sacrifice]! - 0.1);
    if (weightedOverall(scores, pos) < target - 0.049) {
      scores[sacrifice] = round1(scores[sacrifice]! + 0.1);
      break;
    }
  }
  for (let pass = 0; pass < 10; pass += 1) {
    const now = weightedOverall(scores, pos);
    if (Math.abs(now - target) < 0.05) break;
    const dir = now < target ? 0.1 : -0.1;
    const pool = [...dims].filter((dim) => dim !== worst).sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
    let moved = false;
    for (const dim of pool) {
      const next = round1(scores[dim]! + dir);
      if (next > 9.9 || next < 4.5) continue;
      scores[dim] = next;
      moved = true;
      break;
    }
    if (moved) continue;
    const others = Math.max(...dims.filter((dim) => dim !== worst).map((dim) => scores[dim]!));
    const next = round1(scores[worst]! + dir);
    if (dir > 0 && next <= others - 0.6) scores[worst] = next;
    else if (dir < 0 && next >= 4.5) scores[worst] = next;
    else break;
  }
  const axisFloor = target >= 7.3 ? 6.2 : 5.4;
  if (scores[worst]! < axisFloor) {
    scores[worst] = axisFloor;
    for (let pass = 0; pass < 4; pass += 1) {
      if (weightedOverall(scores, pos) <= target + 0.049) break;
      const best = dims.reduce((a, b) => (scores[a]! >= scores[b]! ? a : b));
      if (best === worst || scores[best]! <= axisFloor + 0.4) break;
      scores[best] = round1(scores[best]! - 0.1);
    }
  }
  return scores;
}

function matchSamples(id: string): ScoreMap[] {
  const out: ScoreMap[] = [];
  for (const event of events) {
    const perf = event.performances.find((row) => row.athleteId === id);
    if (perf) out.push(perf.communityAvg);
  }
  return out;
}

function seedsForShown(person: HonorPlayer, shown: ScoreMap, dims: readonly string[]): ScoreMap {
  const samples = matchSamples(person.id);
  if (!samples.length) return shown;
  const weight = person.seedWeight;
  const seed: ScoreMap = {};
  for (const dim of dims) {
    let extra = 0;
    let count = 0;
    for (const sample of samples) {
      const value = sample[dim];
      if (value == null) continue;
      extra += value;
      count += 1;
    }
    if (!count) {
      seed[dim] = shown[dim]!;
      continue;
    }
    seed[dim] = round1(Math.min(12, Math.max(2, (shown[dim]! * (weight + count) - extra) / weight)));
  }
  for (let pass = 0; pass < 6; pass += 1) {
    const blended = blendScores(seed, weight, samples, dims);
    let done = true;
    for (const dim of dims) {
      const want = shown[dim]!;
      const got = blended[dim];
      if (got == null || Math.abs(got - want) < 0.05) continue;
      done = false;
      seed[dim] = round1(Math.min(12, Math.max(2, (seed[dim] ?? want) + (want - got))));
    }
    if (done) break;
  }
  return seed;
}

export const nba2026Players: HonorPlayer[] = ADDED.map((row, index) =>
  player({
    id: row.id,
    name: row.name,
    team: row.team,
    clubId: row.clubId,
    country: row.country,
    sport: "nba",
    pos: row.pos,
    trait: index % 4 === 0 ? "flash" : index % 4 === 1 ? "quiet" : index % 4 === 2 ? "iron" : "leader",
    prestige: 7000 + index,
    weight: 8,
    honorEn: row.en,
    honorZh: row.zh,
    hookEn: row.en,
    hookZh: row.zh,
    axes: dimensionIds(row.pos).map(() => 8),
  }),
);

export function applyNba2026(players: HonorPlayer[]) {
  if (NBA_OVERALL.length !== 100) {
    throw new Error(`nba overall is ${NBA_OVERALL.length}, expected 100`);
  }
  const overall = new Map<string, number>(NBA_OVERALL.map((id, index) => [id, index + 1]));
  const roleOf = new Map<string, { key: PositionKey; order: number }>();
  for (const [key, ids] of Object.entries(NBA_ROLES)) {
    if (ids.length !== 20) throw new Error(`${key} has ${ids.length}, expected 20`);
    ids.forEach((id, index) => {
      if (roleOf.has(id)) throw new Error(`${id} is on two NBA position boards`);
      roleOf.set(id, { key: key as PositionKey, order: index + 1 });
    });
  }
  const seen = new Set<string>();
  for (const person of players) {
    if (person.sport !== "nba" || person.era === "legend") continue;
    if (seen.has(person.id)) throw new Error(`duplicate nba id ${person.id}`);
    seen.add(person.id);
    const rank = overall.get(person.id);
    person.offBoard = !rank;
    if (rank) person.prestige = rank;
    const role = roleOf.get(person.id);
    const position = role?.key ?? (rank ? FALLBACK_POS[person.id] : undefined);
    if (role) person.roleOrder = role.order;
    else delete person.roleOrder;
    if (position) person.positionKey = position;
    if (rank || role) {
      const target = rank ? nbaTarget(rank) : roleOnlyTarget(role?.order ?? 20);
      const dims = dimensionIds(person.positionKey);
      person.scores = seedsForShown(person, shapeToTarget(person, target), dims);
      delete person.fcRating;
    }
  }
  for (const id of overall.keys()) {
    if (!seen.has(id)) throw new Error(`nba overall missing ${id}`);
  }
  for (const id of roleOf.keys()) {
    if (!seen.has(id)) throw new Error(`nba role missing ${id}`);
  }
}
