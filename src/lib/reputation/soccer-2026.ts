import { dimensionIds, type PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";
import { player } from "./build";
import type { HonorPlayer } from "./types";

/** Overall hundred. Guardian 21–100, with the five “already promoted” reference rows removed, then five position-list names to fill the board. */
export const SOCCER_OVERALL = [
  "kane", "yamal", "mbappe", "vitinha", "dembele", "rodri", "olise", "hakimi", "pedri", "rice",
  "haaland", "mendes", "saliba", "raphinha", "salah", "bellingham", "gabriel", "palmer", "saka", "vandijk",
  "lautaro", "vini", "lewa", "julian", "fabian", "gyokeres", "courtois", "luisdiaz", "caicedo", "messi",
  "macallister", "wirtz", "valverde", "szoboszlai", "guirassy", "dumfries", "gravenberch", "marquinhos", "musiala", "pacho",
  "odegaard", "osimhen", "enzo", "isak", "alisson", "kimmich", "ronaldo", "calhanoglu", "barcola", "bastoni",
  "brunofernandes", "eze", "nico", "raya", "estevao", "dejong", "foden", "barella", "cucurella", "sommer",
  "thuram", "fermin", "ekitike", "cubarsi", "bruno", "zubimendi", "guler", "bernardo", "debruyne", "doku",
  "joaopedro", "mbeumo", "emimartinez", "reijnders", "kounde", "oyarzabal", "woltemade", "anguissa", "dias", "grimaldo",
  "nicopaz", "arrascaeta", "semenyo", "yildiz", "merino", "leao", "huijsen", "gvardiol", "neuer", "greenwood",
  "vanderven", "antony", "trent", "dimarco", "griezmann", "kvara", "donnarumma", "unaisimon", "joangarcia", "diogocosta",
] as const;

export const SOCCER_ROLES: Record<string, readonly string[]> = {
  "soccer.keeper": [
    "raya", "courtois", "donnarumma", "unaisimon", "joangarcia", "emimartinez", "alisson", "diogocosta", "pickford", "safonov",
    "sommer", "neuer", "maignan", "terstegen", "oblak", "ederson", "kobel", "lunin", "szczesny", "mamardashvili",
  ],
  "soccer.fullback": [
    "hakimi", "mendes", "timber", "dimarco", "cucurella", "dumfries", "kounde", "hincapie", "grimaldo", "oreilly",
    "trent", "davies", "theohernandez", "frimpong", "balde", "rjames", "pedroporro", "udogie", "robinson", "molina",
  ],
  "soccer.centerback": [
    "saliba", "pacho", "gabriel", "cubarsi", "tah", "marquinhos", "upamecano", "vandijk", "bastoni", "guehi",
    "dias", "huijsen", "vanderven", "rudiger", "konate", "romero", "kim", "araujo", "stones", "schlotterbeck",
  ],
  "soccer.midfielder": [
    "vitinha", "rice", "rodri", "jneves", "pedri", "valverde", "kimmich", "enzo", "caicedo", "fabian",
    "elliotanderson", "pavlovic", "bruno", "bouaddi", "zaireemery", "macallister", "gravenberch", "barella", "dejong", "reijnders",
  ],
  "soccer.attackingmid": [
    "brunofernandes", "bellingham", "szoboszlai", "cherki", "nicopaz", "odegaard", "rogers", "mctominay", "guler", "baumgartner",
    "gibbswhite", "olmo", "musiala", "mcginn", "gnabry", "palmer", "wirtz", "debruyne", "eze", "foden",
  ],
  "soccer.winger": [
    "olise", "yamal", "kvara", "luisdiaz", "messi", "vini", "saka", "raphinha", "nico", "estevao",
    "salah", "barcola", "doku", "mbeumo", "leao", "yildiz", "semenyo", "gakpo", "gordon", "rodrygo",
  ],
  "soccer.striker": [
    "kane", "mbappe", "haaland", "dembele", "lautaro", "lewa", "julian", "joaopedro", "gyokeres", "guirassy",
    "igorthiago", "osimhen", "isak", "ronaldo", "thuram", "ekitike", "sesko", "woltemade", "greenwood", "griezmann",
  ],
};

/** Club written on the card when the 2026 list names one. */
const CLUBS: Record<string, { team: string; clubId?: string }> = {
  bruno: { team: "Arsenal", clubId: "arsenal" },
  donnarumma: { team: "Manchester City", clubId: "mancity" },
  luisdiaz: { team: "Bayern Munich", clubId: "bayern" },
  dumfries: { team: "Real Madrid", clubId: "realmadrid" },
  cucurella: { team: "Real Madrid", clubId: "realmadrid" },
  grimaldo: { team: "Atlético Madrid", clubId: "atletico" },
  guehi: { team: "Manchester City", clubId: "mancity" },
  rogers: { team: "Chelsea", clubId: "chelsea" },
  emimartinez: { team: "Aston Villa" },
  joangarcia: { team: "Barcelona", clubId: "barcelona" },
  timber: { team: "Arsenal", clubId: "arsenal" },
  hincapie: { team: "Arsenal", clubId: "arsenal" },
  oreilly: { team: "Manchester City", clubId: "mancity" },
  elliotanderson: { team: "Manchester City", clubId: "mancity" },
  cherki: { team: "Manchester City", clubId: "mancity" },
  zubimendi: { team: "Arsenal", clubId: "arsenal" },
  reijnders: { team: "Manchester City", clubId: "mancity" },
  huijsen: { team: "Real Madrid", clubId: "realmadrid" },
  ekitike: { team: "Liverpool", clubId: "liverpool" },
  estevao: { team: "Chelsea", clubId: "chelsea" },
  pacho: { team: "Paris Saint-Germain", clubId: "psg" },
  tah: { team: "Bayern Munich", clubId: "bayern" },
  upamecano: { team: "Bayern Munich", clubId: "bayern" },
};

const BASE: Record<string, number[]> = {
  "soccer.striker": [8.8, 8.2, 7.6, 7.6, 8.4],
  "soccer.winger": [8.7, 8.2, 8.2, 6.6, 8.2],
  "soccer.midfielder": [8.6, 8.3, 8.2, 8.6, 8.3],
  "soccer.attackingmid": [8.6, 8.8, 6.4, 8.2, 8.5],
  "soccer.fullback": [8.2, 8.4, 8.0, 8.6, 8.0],
  "soccer.centerback": [8.4, 8.5, 8.6, 7.8, 8.3],
  "soccer.keeper": [8.5, 8.6, 7.8, 8.2, 8.3],
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
  { id: "luisdiaz", name: "Luis Díaz", team: "Bayern Munich", clubId: "bayern", country: "Colombia", pos: "soccer.winger", zh: "拜仁的边路，ESPN 边锋第 4", en: "Bayern's wide runner, ESPN winger No. 4" },
  { id: "guirassy", name: "Serhou Guirassy", team: "Borussia Dortmund", country: "Guinea", pos: "soccer.striker", zh: "多特蒙德的中锋，禁区里的第一下", en: "Dortmund's nine, first to the six-yard box" },
  { id: "dumfries", name: "Denzel Dumfries", team: "Real Madrid", clubId: "realmadrid", country: "Netherlands", pos: "soccer.fullback", zh: "皇马的边路冲刺，ESPN 边后卫第 6", en: "Madrid's overlap, ESPN full-back No. 6" },
  { id: "gravenberch", name: "Ryan Gravenberch", team: "Liverpool", clubId: "liverpool", country: "Netherlands", pos: "soccer.midfielder", zh: "利物浦带球向前的那个中场", en: "Liverpool's carrier through the middle" },
  { id: "pacho", name: "Willian Pacho", team: "Paris Saint-Germain", clubId: "psg", country: "Ecuador", pos: "soccer.centerback", zh: "巴黎的中卫，ESPN 中后卫第 2", en: "PSG's centre-back, ESPN No. 2" },
  { id: "estevao", name: "Estêvão", team: "Chelsea", clubId: "chelsea", country: "Brazil", pos: "soccer.winger", zh: "切尔西的新边锋，第一步比解说快", en: "Chelsea's new winger, first touch ahead of the call" },
  { id: "dejong", name: "Frenkie de Jong", team: "Barcelona", clubId: "barcelona", country: "Netherlands", pos: "soccer.midfielder", zh: "巴萨转身出球的那个", en: "Barcelona's turn-and-play midfielder" },
  { id: "cucurella", name: "Marc Cucurella", team: "Real Madrid", clubId: "realmadrid", country: "Spain", pos: "soccer.fullback", zh: "皇马的边后卫，ESPN 第 5", en: "Madrid full-back, ESPN No. 5" },
  { id: "sommer", name: "Yann Sommer", team: "Inter", clubId: "inter", country: "Switzerland", pos: "soccer.keeper", zh: "国米门将，位置榜第 11", en: "Inter's goalkeeper, No. 11 on the keeper board" },
  { id: "fermin", name: "Fermín López", team: "Barcelona", clubId: "barcelona", country: "Spain", pos: "soccer.attackingmid", zh: "巴萨插进禁区的中场", en: "Barcelona's midfielder arriving in the box" },
  { id: "ekitike", name: "Hugo Ekitike", team: "Liverpool", clubId: "liverpool", country: "France", pos: "soccer.striker", zh: "利物浦的跑动中锋", en: "Liverpool's runner at centre-forward" },
  { id: "zubimendi", name: "Martín Zubimendi", team: "Arsenal", clubId: "arsenal", country: "Spain", pos: "soccer.midfielder", zh: "阿森纳的节拍，先把球给对", en: "Arsenal's tempo, the pass before the noise" },
  { id: "joaopedro", name: "João Pedro", team: "Chelsea", clubId: "chelsea", country: "Brazil", pos: "soccer.striker", zh: "切尔西的中锋，ESPN 中锋第 8", en: "Chelsea's striker, ESPN No. 8" },
  { id: "emimartinez", name: "Emiliano Martínez", team: "Aston Villa", country: "Argentina", pos: "soccer.keeper", zh: "维拉门将，ESPN 门将第 6", en: "Villa's goalkeeper, ESPN No. 6" },
  { id: "reijnders", name: "Tijjani Reijnders", team: "Manchester City", clubId: "mancity", country: "Netherlands", pos: "soccer.midfielder", zh: "曼城从中场向前的那一步", en: "City's step forward from midfield" },
  { id: "oyarzabal", name: "Mikel Oyarzabal", team: "Real Sociedad", country: "Spain", pos: "soccer.winger", zh: "皇家社会的内切和点球", en: "Sociedad's cut inside, and the penalty" },
  { id: "woltemade", name: "Nick Woltemade", team: "Newcastle United", country: "Germany", pos: "soccer.striker", zh: "纽卡斯尔的高点中锋", en: "Newcastle's aerial centre-forward" },
  { id: "anguissa", name: "André-Frank Zambo Anguissa", team: "Napoli", clubId: "napoli", country: "Cameroon", pos: "soccer.midfielder", zh: "那不勒斯中场的对抗", en: "Napoli's midfield duel" },
  { id: "grimaldo", name: "Álex Grimaldo", team: "Atlético Madrid", clubId: "atletico", country: "Spain", pos: "soccer.fullback", zh: "马竞左边，ESPN 边后卫第 9", en: "Atlético's left side, ESPN full-back No. 9" },
  { id: "nicopaz", name: "Nico Paz", team: "Como", country: "Argentina", pos: "soccer.attackingmid", zh: "科莫的进攻中场，ESPN 第 5", en: "Como's attacking mid, ESPN No. 5" },
  { id: "arrascaeta", name: "Giorgian de Arrascaeta", team: "Flamengo", country: "Uruguay", pos: "soccer.attackingmid", zh: "弗拉门戈的 10 号，南美的最后一传", en: "Flamengo's No. 10, South America's last pass" },
  { id: "semenyo", name: "Antoine Semenyo", team: "Bournemouth", country: "Ghana", pos: "soccer.winger", zh: "伯恩茅斯的边路冲击", en: "Bournemouth's direct wide runner" },
  { id: "merino", name: "Mikel Merino", team: "Arsenal", clubId: "arsenal", country: "Spain", pos: "soccer.midfielder", zh: "阿森纳插上去的那个中场", en: "Arsenal's midfielder arriving late" },
  { id: "huijsen", name: "Dean Huijsen", team: "Real Madrid", clubId: "realmadrid", country: "Spain", pos: "soccer.centerback", zh: "皇马的年轻中卫，出球先于对抗", en: "Madrid's young centre-back, pass before the duel" },
  { id: "greenwood", name: "Mason Greenwood", team: "Marseille", country: "England", pos: "soccer.striker", zh: "马赛的内切射门", en: "Marseille's shot off the cut inside" },
  { id: "vanderven", name: "Micky van de Ven", team: "Tottenham Hotspur", country: "Netherlands", pos: "soccer.centerback", zh: "热刺中卫，速度把单刀追回来", en: "Spurs centre-back, the recovery sprint" },
  { id: "antony", name: "Antony", team: "Real Betis", country: "Brazil", pos: "soccer.winger", zh: "贝蒂斯的右边，假动作还在", en: "Betis on the right, the stepover still employed" },
  { id: "dimarco", name: "Federico Dimarco", team: "Inter", clubId: "inter", country: "Italy", pos: "soccer.fullback", zh: "国米左路，ESPN 边后卫第 4", en: "Inter's left side, ESPN full-back No. 4" },
  { id: "unaisimon", name: "Unai Simón", team: "Athletic Club", country: "Spain", pos: "soccer.keeper", zh: "毕尔巴鄂门将，ESPN 第 4", en: "Athletic Club goalkeeper, ESPN No. 4" },
  { id: "joangarcia", name: "Joan García", team: "Barcelona", clubId: "barcelona", country: "Spain", pos: "soccer.keeper", zh: "巴萨门将，ESPN 第 5", en: "Barcelona goalkeeper, ESPN No. 5" },
  { id: "diogocosta", name: "Diogo Costa", team: "Porto", country: "Portugal", pos: "soccer.keeper", zh: "波尔图门将，ESPN 第 8", en: "Porto's goalkeeper, ESPN No. 8" },
  { id: "pickford", name: "Jordan Pickford", team: "Everton", country: "England", pos: "soccer.keeper", zh: "埃弗顿门将，ESPN 第 9", en: "Everton goalkeeper, ESPN No. 9" },
  { id: "safonov", name: "Matvei Safonov", team: "Paris Saint-Germain", clubId: "psg", country: "Russia", pos: "soccer.keeper", zh: "巴黎门将，ESPN 第 10", en: "PSG goalkeeper, ESPN No. 10" },
  { id: "maignan", name: "Mike Maignan", team: "Milan", clubId: "milan", country: "France", pos: "soccer.keeper", zh: "米兰门将，出击和脚法同一班次", en: "Milan's goalkeeper, claim and pass in the same shift" },
  { id: "oblak", name: "Jan Oblak", team: "Atlético Madrid", clubId: "atletico", country: "Slovenia", pos: "soccer.keeper", zh: "马竞门将，站位先于扑救", en: "Atlético's goalkeeper, position before the dive" },
  { id: "kobel", name: "Gregor Kobel", team: "Borussia Dortmund", country: "Switzerland", pos: "soccer.keeper", zh: "多特门将，点球线后面的第一下", en: "Dortmund's goalkeeper, first to the near post" },
  { id: "lunin", name: "Andriy Lunin", team: "Real Madrid", clubId: "realmadrid", country: "Ukraine", pos: "soccer.keeper", zh: "皇马的替补门将，决赛里扑过点球", en: "Madrid's other goalkeeper, penalties included" },
  { id: "szczesny", name: "Wojciech Szczęsny", team: "Barcelona", clubId: "barcelona", country: "Poland", pos: "soccer.keeper", zh: "巴萨门前的经验", en: "Barcelona's experienced pair of hands" },
  { id: "mamardashvili", name: "Giorgi Mamardashvili", team: "Liverpool", clubId: "liverpool", country: "Georgia", pos: "soccer.keeper", zh: "利物浦门将，反应先于站位", en: "Liverpool goalkeeper, reflex before the set" },
  { id: "timber", name: "Jurriën Timber", team: "Arsenal", clubId: "arsenal", country: "Netherlands", pos: "soccer.fullback", zh: "阿森纳边后卫，ESPN 第 3", en: "Arsenal full-back, ESPN No. 3" },
  { id: "hincapie", name: "Piero Hincapié", team: "Arsenal", clubId: "arsenal", country: "Ecuador", pos: "soccer.fullback", zh: "阿森纳边路，ESPN 边后卫第 8", en: "Arsenal wide, ESPN full-back No. 8" },
  { id: "oreilly", name: "Nico O'Reilly", team: "Manchester City", clubId: "mancity", country: "England", pos: "soccer.fullback", zh: "曼城边后卫，ESPN 第 10", en: "City full-back, ESPN No. 10" },
  { id: "theohernandez", name: "Theo Hernández", team: "Milan", clubId: "milan", country: "France", pos: "soccer.fullback", zh: "米兰左边，插上像边锋", en: "Milan's left side, the overlap of a winger" },
  { id: "pedroporro", name: "Pedro Porro", team: "Tottenham Hotspur", country: "Spain", pos: "soccer.fullback", zh: "热刺右路，传中比回追更有名", en: "Spurs' right side, the cross before the recovery" },
  { id: "udogie", name: "Destiny Udogie", team: "Tottenham Hotspur", country: "Italy", pos: "soccer.fullback", zh: "热刺左路，带球超过中线", en: "Spurs' left side, carrying past halfway" },
  { id: "robinson", name: "Antonee Robinson", team: "Fulham", country: "USA", pos: "soccer.fullback", zh: "富勒姆左边，速度把边锋留在身后", en: "Fulham's left-back, pace past the winger" },
  { id: "tah", name: "Jonathan Tah", team: "Bayern Munich", clubId: "bayern", country: "Germany", pos: "soccer.centerback", zh: "拜仁中卫，ESPN 第 5", en: "Bayern centre-back, ESPN No. 5" },
  { id: "upamecano", name: "Dayot Upamecano", team: "Bayern Munich", clubId: "bayern", country: "France", pos: "soccer.centerback", zh: "拜仁中卫，ESPN 第 7", en: "Bayern centre-back, ESPN No. 7" },
  { id: "guehi", name: "Marc Guéhi", team: "Manchester City", clubId: "mancity", country: "England", pos: "soccer.centerback", zh: "曼城中卫，ESPN 第 10", en: "City centre-back, ESPN No. 10" },
  { id: "araujo", name: "Ronald Araújo", team: "Barcelona", clubId: "barcelona", country: "Uruguay", pos: "soccer.centerback", zh: "巴萨中卫，对抗先于出球", en: "Barcelona centre-back, the duel before the pass" },
  { id: "stones", name: "John Stones", team: "Manchester City", clubId: "mancity", country: "England", pos: "soccer.centerback", zh: "曼城中卫，带球插到中场", en: "City centre-back, stepping into midfield" },
  { id: "elliotanderson", name: "Elliot Anderson", team: "Manchester City", clubId: "mancity", country: "England", pos: "soccer.midfielder", zh: "曼城中前卫，ESPN 第 11", en: "City central mid, ESPN No. 11" },
  { id: "pavlovic", name: "Aleksandar Pavlović", team: "Bayern Munich", clubId: "bayern", country: "Germany", pos: "soccer.midfielder", zh: "拜仁中前卫，ESPN 第 12", en: "Bayern central mid, ESPN No. 12" },
  { id: "bouaddi", name: "Ayyoub Bouaddi", team: "Lille", country: "Morocco", pos: "soccer.midfielder", zh: "里尔的年轻中前卫，ESPN 第 14", en: "Lille's young midfielder, ESPN No. 14" },
  { id: "zaireemery", name: "Warren Zaïre-Emery", team: "Paris Saint-Germain", clubId: "psg", country: "France", pos: "soccer.midfielder", zh: "巴黎中前卫，ESPN 第 15", en: "PSG central mid, ESPN No. 15" },
  { id: "cherki", name: "Rayan Cherki", team: "Manchester City", clubId: "mancity", country: "France", pos: "soccer.attackingmid", zh: "曼城进攻中场，ESPN 第 4", en: "City attacking mid, ESPN No. 4" },
  { id: "rogers", name: "Morgan Rogers", team: "Chelsea", clubId: "chelsea", country: "England", pos: "soccer.attackingmid", zh: "切尔西进攻中场，ESPN 第 7", en: "Chelsea attacking mid, ESPN No. 7" },
  { id: "mctominay", name: "Scott McTominay", team: "Napoli", clubId: "napoli", country: "Scotland", pos: "soccer.attackingmid", zh: "那不勒斯的插上，ESPN 进攻中场第 8", en: "Napoli's late run, ESPN attacking mid No. 8" },
  { id: "baumgartner", name: "Christoph Baumgartner", team: "RB Leipzig", country: "Austria", pos: "soccer.attackingmid", zh: "莱比锡进攻中场，ESPN 第 10", en: "Leipzig attacking mid, ESPN No. 10" },
  { id: "gibbswhite", name: "Morgan Gibbs-White", team: "Nottingham Forest", country: "England", pos: "soccer.attackingmid", zh: "森林队的进攻中场，ESPN 第 11", en: "Forest's attacking mid, ESPN No. 11" },
  { id: "mcginn", name: "John McGinn", team: "Aston Villa", country: "Scotland", pos: "soccer.attackingmid", zh: "维拉的进攻中场，ESPN 第 14", en: "Villa's attacking mid, ESPN No. 14" },
  { id: "gnabry", name: "Serge Gnabry", team: "Bayern Munich", clubId: "bayern", country: "Germany", pos: "soccer.attackingmid", zh: "拜仁的内切，ESPN 进攻中场第 15", en: "Bayern's cut inside, ESPN attacking mid No. 15" },
  { id: "igorthiago", name: "Igor Thiago", team: "Brentford", country: "Brazil", pos: "soccer.striker", zh: "布伦特福德的中锋，ESPN 中锋第 11", en: "Brentford's striker, ESPN No. 11" },
  { id: "molina", name: "Nahuel Molina", team: "Atlético Madrid", clubId: "atletico", country: "Argentina", pos: "soccer.fullback", zh: "马竞右路，助攻比封堵多", en: "Atlético's right side, the overlap more than the block" },
  { id: "schlotterbeck", name: "Nico Schlotterbeck", team: "Borussia Dortmund", country: "Germany", pos: "soccer.centerback", zh: "多特中卫，带球出禁区", en: "Dortmund centre-back, carrying it out" },
];

export function soccerRating(rank: number) {
  if (rank <= 12) return 100 - rank;
  return Math.max(78, 88 - Math.floor((rank - 12) * 0.12));
}

function hash(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function scoresFor(pos: PositionKey, rating: number, id: string): ScoreMap {
  const dims = dimensionIds(pos);
  const salt = hash(id);
  const level = rating / 10;
  return Object.fromEntries(
    dims.map((dim, index) => {
      const wobble = (((salt + index * 5) % 7) - 3) * 0.1;
      const lead = index === 0 ? 0.25 : 0;
      return [dim, Math.round(Math.min(9.9, Math.max(4.4, level + lead + wobble)) * 10) / 10];
    }),
  ) as ScoreMap;
}

function alignScores(person: HonorPlayer, rating: number) {
  const dims = dimensionIds(person.positionKey);
  const ready = dims.every((id) => typeof person.scores[id] === "number");
  if (!ready) {
    person.scores = scoresFor(person.positionKey, rating, person.id);
    return;
  }
  const mean = dims.reduce((sum, id) => sum + person.scores[id]!, 0) / dims.length;
  const delta = rating / 10 - mean;
  const next: ScoreMap = {};
  for (const id of dims) {
    next[id] = Math.round(Math.min(9.9, Math.max(4.2, person.scores[id]! + delta)) * 10) / 10;
  }
  person.scores = next;
}

function axesFor(pos: PositionKey, index: number) {
  const base = BASE[pos] ?? BASE["soccer.midfielder"]!;
  return base.map((value, axis) => {
    const next = value - index * 0.03 + (axis === 0 ? 0.15 : 0);
    return Math.round(Math.min(9.6, Math.max(6.2, next)) * 10) / 10;
  });
}

export const soccer2026Players: HonorPlayer[] = ADDED.map((row, index) =>
  player({
    id: row.id,
    name: row.name,
    team: row.team,
    clubId: row.clubId,
    country: row.country,
    sport: "soccer",
    pos: row.pos,
    trait: index % 5 === 0 ? "flash" : index % 5 === 1 ? "iron" : index % 5 === 2 ? "leader" : "quiet",
    prestige: 8000 + index,
    weight: 8,
    honorEn: row.en,
    honorZh: row.zh,
    hookEn: row.en,
    hookZh: row.zh,
    axes: axesFor(row.pos, index % 12),
  }),
);

export function applySoccer2026(players: HonorPlayer[]) {
  if (SOCCER_OVERALL.length !== 100) {
    throw new Error(`soccer overall is ${SOCCER_OVERALL.length}, expected 100`);
  }
  const overall = new Map<string, number>(SOCCER_OVERALL.map((id, index) => [id, index + 1]));
  const roleOf = new Map<string, { key: PositionKey; order: number }>();
  for (const [key, ids] of Object.entries(SOCCER_ROLES)) {
    if (ids.length !== 20) throw new Error(`${key} has ${ids.length}, expected 20`);
    ids.forEach((id, index) => {
      if (roleOf.has(id)) throw new Error(`${id} is on two position boards`);
      roleOf.set(id, { key: key as PositionKey, order: index + 1 });
    });
  }
  const seen = new Set<string>();
  for (const person of players) {
    if (person.sport !== "soccer" || person.era === "legend") continue;
    if (seen.has(person.id)) throw new Error(`duplicate soccer id ${person.id}`);
    seen.add(person.id);
    const rank = overall.get(person.id);
    person.offBoard = !rank;
    if (rank) person.prestige = rank;
    const role = roleOf.get(person.id);
    if (role) {
      person.positionKey = role.key;
      person.roleOrder = role.order;
    } else {
      delete person.roleOrder;
    }
    const club = CLUBS[person.id];
    if (club) {
      person.team = club.team;
      if (club.clubId) person.clubId = club.clubId;
    }
    if (rank || role) {
      const rating = rank ? soccerRating(rank) : Math.max(76, 84 - (role?.order ?? 20));
      person.fcRating = rating;
      alignScores(person, rating);
    }
  }
  for (const id of overall.keys()) {
    if (!seen.has(id)) throw new Error(`soccer overall missing ${id}`);
  }
  for (const id of roleOf.keys()) {
    if (!seen.has(id)) throw new Error(`soccer role missing ${id}`);
  }
}
