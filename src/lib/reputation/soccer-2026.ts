import { events } from "@/lib/data";
import { dimensionIds, getPositionProfile, weightedOverall, type PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";
import { blendScores } from "./blend";
import { player } from "./build";
import type { HonorPlayer } from "./types";

/** Overall hundred. Guardian 21–100, with the five “already promoted” reference rows removed, then five position-list names to fill the board. */
export const SOCCER_OVERALL = [
  "kane", "yamal", "mbappe", "vitinha", "dembele", "rodri", "olise", "hakimi", "pedri", "rice",
  "haaland", "mendes", "kvara", "saliba", "raphinha", "salah", "bellingham", "gabriel", "palmer", "saka", "vandijk",
  "lautaro", "vini", "lewa", "julian", "fabian", "gyokeres", "courtois", "luisdiaz", "caicedo", "messi",
  "macallister", "wirtz", "valverde", "szoboszlai", "guirassy", "dumfries", "gravenberch", "marquinhos", "musiala", "pacho",
  "odegaard", "osimhen", "enzo", "isak", "alisson", "kimmich", "ronaldo", "calhanoglu", "barcola", "bastoni",
  "brunofernandes", "eze", "nico", "raya", "estevao", "dejong", "foden", "barella", "cucurella", "sommer",
  "thuram", "fermin", "ekitike", "cubarsi", "bruno", "zubimendi", "guler", "bernardo", "debruyne", "doku",
  "joaopedro", "mbeumo", "emimartinez", "reijnders", "kounde", "oyarzabal", "woltemade", "anguissa", "dias", "grimaldo",
  "nicopaz", "arrascaeta", "semenyo", "yildiz", "merino", "leao", "huijsen", "gvardiol", "neuer", "greenwood",
  "vanderven", "antony", "trent", "dimarco", "griezmann", "donnarumma", "unaisimon", "joangarcia", "diogocosta",
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

const ADDED_IDS = new Set(ADDED.map((row) => row.id));

/**
 * Headline on a 10-point scale. The drops are uneven: the top of the list
 * stays packed, then the list loosens. Neighbors can share a number.
 * A lower rank never targets a higher number.
 */
export function soccerTarget(rank: number) {
  const bands: readonly [number, number][] = [
    [1, 9.4],
    [3, 9.3],
    [5, 9.2],
    [8, 9.1],
    [13, 9.0],
    [19, 8.8],
    [26, 8.7],
    [35, 8.5],
    [46, 8.3],
    [59, 8.1],
    [71, 7.9],
    [83, 7.7],
    [93, 7.5],
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

/** Shape to use when the stored axes belong to another position, or were a flat template. */
const VOICE: Record<string, ScoreMap> = {
  messi: { dribbling: 9.6, crossing: 7.6, finishing: 8.7, tracking: 4.8, decision: 9.5 },
  foden: { passing: 8.4, vision: 8.9, defending: 6.1, stamina: 7.6, tempo: 8.6 },
  gordon: { dribbling: 8.3, crossing: 8.5, finishing: 7.7, tracking: 8.6, decision: 7.5 },
  doku: { dribbling: 9.3, crossing: 7.6, finishing: 7.2, tracking: 6.2, decision: 7.3 },
  luisdiaz: { dribbling: 8.8, crossing: 8.2, finishing: 8.0, tracking: 6.8, decision: 7.8 },
  enzo: { passing: 8.8, vision: 8.5, defending: 8.2, stamina: 8.4, tempo: 8.6 },
  szoboszlai: { passing: 8.2, vision: 8.5, defending: 7.3, stamina: 8.8, tempo: 8.7 },
  dimarco: { defending: 7.0, overlap: 8.8, delivery: 9.2, pace: 8.0, focus: 7.4 },
  gvardiol: { aerial: 8.4, tackling: 8.3, positioning: 8.6, buildup: 8.9, composure: 7.8 },
  unaisimon: { saves: 8.4, reflexes: 8.2, distribution: 8.7, command: 8.3, positioning: 8.1 },
  joangarcia: { saves: 8.7, reflexes: 8.9, distribution: 7.1, command: 7.5, positioning: 8.2 },
  stones: { aerial: 7.4, tackling: 8.2, positioning: 8.7, buildup: 9.2, composure: 8.5 },
  bastoni: { aerial: 8.3, tackling: 8.4, positioning: 8.6, buildup: 9.3, composure: 8.5 },
  pacho: { aerial: 8.8, tackling: 8.6, positioning: 8.5, buildup: 7.3, composure: 8.0 },
  schlotterbeck: { aerial: 7.8, tackling: 8.2, positioning: 8.0, buildup: 8.9, composure: 7.5 },
  gakpo: { dribbling: 8.3, crossing: 7.6, finishing: 8.6, tracking: 7.5, decision: 7.7 },
  sesko: { finishing: 8.6, movement: 8.4, linkup: 7.2, pressing: 7.8, composure: 7.4 },
  frimpong: { defending: 6.8, overlap: 9.0, delivery: 7.4, pace: 9.2, focus: 7.0 },
  balde: { defending: 7.6, overlap: 8.8, delivery: 7.0, pace: 9.0, focus: 7.4 },
  grimaldo: { defending: 7.2, overlap: 8.6, delivery: 8.9, pace: 8.0, focus: 7.6 },
  davies: { defending: 7.2, overlap: 8.8, delivery: 7.5, pace: 9.4, focus: 7.4 },
  ederson: { saves: 8.2, reflexes: 8.2, distribution: 9.3, command: 7.6, positioning: 8.1 },
  neuer: { saves: 8.4, reflexes: 8.2, distribution: 8.8, command: 9.2, positioning: 7.4 },
  debruyne: { passing: 9.4, vision: 9.4, defending: 6.4, stamina: 6.2, tempo: 8.8 },
};

const HOLES: Record<string, readonly string[]> = {
  "soccer.striker": ["movement", "linkup", "pressing"],
  "soccer.winger": ["tracking", "crossing", "decision"],
  "soccer.midfielder": ["defending", "vision", "tempo"],
  "soccer.attackingmid": ["defending", "stamina", "passing"],
  "soccer.fullback": ["defending", "delivery", "focus"],
  "soccer.centerback": ["buildup", "aerial", "composure"],
  "soccer.keeper": ["distribution", "command"],
};

const RELATIVES: Record<string, readonly string[]> = {
  finishing: ["finishing"],
  movement: ["movement", "dribbling", "pace"],
  linkup: ["linkup", "passing", "decision", "vision"],
  pressing: ["pressing", "tracking", "defending", "stamina"],
  composure: ["composure", "decision", "focus"],
  dribbling: ["dribbling", "movement", "tempo", "pace"],
  crossing: ["crossing", "delivery", "linkup"],
  tracking: ["tracking", "pressing", "defending"],
  decision: ["decision", "vision", "composure", "tempo"],
  passing: ["passing", "crossing", "linkup", "buildup", "distribution"],
  vision: ["vision", "decision", "composure"],
  defending: ["defending", "tackling", "tracking", "pressing"],
  stamina: ["stamina", "pressing", "focus", "pace"],
  tempo: ["tempo", "dribbling", "movement", "vision"],
  overlap: ["overlap", "pace", "movement", "dribbling"],
  delivery: ["delivery", "crossing", "passing"],
  pace: ["pace", "movement", "dribbling"],
  focus: ["focus", "composure", "positioning"],
  aerial: ["aerial"],
  tackling: ["tackling", "defending"],
  positioning: ["positioning", "focus"],
  buildup: ["buildup", "passing", "vision"],
  saves: ["saves"],
  reflexes: ["reflexes"],
  distribution: ["distribution", "passing"],
  command: ["command", "composure"],
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
  // A nearly even player stays nearly even. Stretching a 0.3 gap into a full hole invents a weakness.
  const scale = span < 0.8 ? 0.35 : 1;
  return Object.fromEntries(dims.map((dim, index) => [dim, ((best - values[index]!) / span) * scale]));
}

function templateDrops(pos: PositionKey, id: string, dims: readonly string[]) {
  const weights = getPositionProfile(pos).weights;
  const salt = hash(id);
  let peak = [...dims].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0))[0]!;
  let holes = (HOLES[pos] ?? dims).filter((dim) => dims.includes(dim));
  if (pos === "soccer.fullback") {
    const attacker = salt % 5 !== 0;
    peak = attacker ? (salt % 2 === 0 ? "overlap" : "pace") : "defending";
    holes = attacker ? ["defending", "focus"] : ["delivery", "overlap"];
  } else if (pos === "soccer.keeper") {
    peak = salt % 2 === 0 ? "saves" : "reflexes";
    holes = ["distribution", "command"];
  } else if (pos === "soccer.centerback") {
    peak = salt % 3 === 0 ? "tackling" : "positioning";
    holes = ["buildup", "aerial"];
  }
  const hole = holes.filter((dim) => dim !== peak)[salt % Math.max(1, holes.filter((dim) => dim !== peak).length)] ?? dims[dims.length - 1]!;
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
    const relatives = RELATIVES[dim] ?? [dim];
    const found = relatives.find((key) => typeof scores[key] === "number");
    if (!found) return null;
    out[dim] = scores[found]!;
  }
  return out;
}

function sourceProfile(person: HonorPlayer, dims: readonly string[]): ScoreMap | null {
  const voice = VOICE[person.id];
  if (voice && dims.every((dim) => typeof voice[dim] === "number")) return voice;
  if (!ADDED_IDS.has(person.id) && dims.every((dim) => typeof person.scores[dim] === "number")) {
    return Object.fromEntries(dims.map((dim) => [dim, person.scores[dim]!])) as ScoreMap;
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
  for (const dim of dims) {
    scores[dim] = bestLevel - (drops[dim] ?? 0) * hole;
  }

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
  // Only the signature skill sits on the ceiling. Tied 9.9s are the flat radar this avoids.
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
    const pool = [...dims]
      .filter((dim) => dim !== worst)
      .sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
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

/** Stored axes are blended with match cards. Solve the seed so the card shows `shown`. */
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
    const solved = (shown[dim]! * (weight + count) - extra) / weight;
    seed[dim] = round1(Math.min(12, Math.max(2, solved)));
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
      const target = rank ? soccerTarget(rank) : roleOnlyTarget(role?.order ?? 20);
      const dims = dimensionIds(person.positionKey);
      const shown = shapeToTarget(person, target);
      person.scores = seedsForShown(person, shown, dims);
      delete person.fcRating;
    }
  }
  for (const id of overall.keys()) {
    if (!seen.has(id)) throw new Error(`soccer overall missing ${id}`);
  }
  for (const id of roleOf.keys()) {
    if (!seen.has(id)) throw new Error(`soccer role missing ${id}`);
  }
}
