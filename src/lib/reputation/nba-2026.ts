import { dimensionIds, type PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";
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

function hash(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function nbaRating(rank: number) {
  if (rank === 1) return 99;
  if (rank === 2) return 98;
  return Math.max(78, 97 - Math.floor((rank - 3) * 0.2));
}

function scoresFor(pos: PositionKey, rating: number, id: string): ScoreMap {
  const dims = dimensionIds(pos);
  const salt = hash(id);
  const level = rating / 10;
  const bump: Record<string, number> = {};
  if (pos === "nba.pointguard") bump.playmaking = 0.35;
  if (pos === "nba.shootingguard") bump.scoring = 0.4;
  if (pos === "nba.smallforward") bump.scoring = 0.25;
  if (pos === "nba.powerforward") bump.rebounding = 0.3;
  if (pos === "nba.center") bump.rim_def = 0.35;
  return Object.fromEntries(
    dims.map((dim, index) => {
      const wobble = (((salt + index * 5) % 7) - 3) * 0.08;
      const value = level + (bump[dim] ?? 0) + wobble;
      return [dim, Math.round(Math.min(9.9, Math.max(6.2, value)) * 10) / 10];
    }),
  ) as ScoreMap;
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
    const rating = rank ? nbaRating(rank) : Math.max(74, 82 - (role?.order ?? 20));
    person.fcRating = rating;
    if (position) person.scores = scoresFor(position, rating, person.id);
  }
  for (const id of overall.keys()) {
    if (!seen.has(id)) throw new Error(`nba overall missing ${id}`);
  }
  for (const id of roleOf.keys()) {
    if (!seen.has(id)) throw new Error(`nba role missing ${id}`);
  }
}
