import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { positionDimLabels, positionRoleLabels } from "../src/i18n/position-dims";
import {
  activePlayers,
  honorBoard,
  honorTeams,
  legendPlayers,
  playersOnClub,
  presentPlayer,
  presentTeam,
} from "../src/lib/reputation/catalog";
import type { ReputationCard } from "../src/lib/reputation/types";
import { athletes, events } from "../src/lib/data";
import { POSITION_PROFILES } from "../src/lib/position-ratings";
import { SPORTS, type Sport } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "mobile", "src", "data");
const portraitRoot = join(root, "public", "portraits");

const sportLabels = {
  zh: {
    nba: "NBA",
    soccer: "足球",
    esports: "电竞",
    nfl: "NFL",
    f1: "F1",
    tennis: "网球",
    ufc: "UFC",
  },
  en: {
    nba: "NBA",
    soccer: "Soccer",
    esports: "Esports",
    nfl: "NFL",
    f1: "F1",
    tennis: "Tennis",
    ufc: "UFC",
  },
} as const;

const teamDims = {
  zh: {
    nba: { scoring: "得分", defense: "防守", playmaking: "组织", hustle: "拼劲", clutch: "关键球" },
    soccer: { attack: "进攻", creation: "做戏", defending: "防守", workrate: "跑动", composure: "心态" },
    esports: { mechanics: "操作", macro: "大局", impact: "影响力", consistency: "稳定性", clutch: "关键局" },
    nfl: { execution: "执行", physicality: "对抗", awareness: "阅读", consistency: "稳定", clutch: "关键" },
    f1: { pace: "圈速", racecraft: "车轮战", tyres: "轮胎", consistency: "稳定", composure: "心态" },
    tennis: { serve: "发球", return: "接发", rally: "相持", movement: "移动", clutch: "关键分" },
    ufc: { striking: "打击", grappling: "地面", cardio: "体能", control: "控制", composure: "冷静" },
  },
  en: {
    nba: { scoring: "Scoring", defense: "Defense", playmaking: "Playmaking", hustle: "Hustle", clutch: "Clutch" },
    soccer: { attack: "Attack", creation: "Creation", defending: "Defending", workrate: "Work rate", composure: "Composure" },
    esports: { mechanics: "Mechanics", macro: "Macro", impact: "Impact", consistency: "Consistency", clutch: "Clutch" },
    nfl: { execution: "Execution", physicality: "Physicality", awareness: "Awareness", consistency: "Consistency", clutch: "Clutch" },
    f1: { pace: "Pace", racecraft: "Racecraft", tyres: "Tyres", consistency: "Consistency", composure: "Composure" },
    tennis: { serve: "Serve", return: "Return", rally: "Rally", movement: "Movement", clutch: "Clutch" },
    ufc: { striking: "Striking", grappling: "Grappling", cardio: "Cardio", control: "Control", composure: "Composure" },
  },
} as const;

type Slim = {
  id: string;
  name: string;
  sport: Sport;
  subtitle: string;
  positionKey?: string;
  rank: number;
  honorZh: string;
  honorEn: string;
  scores: Record<string, number>;
  dimIds: string[];
  overall: number;
  digits: number;
  kitNumber?: string;
  photo?: string;
  takes: { zh: string; en: string }[];
};

function photoFor(sport: string, id: string) {
  const rel = `${sport}/${id}.jpg`;
  return existsSync(join(portraitRoot, rel)) ? rel : undefined;
}

function slim(card: ReputationCard): Slim {
  return {
    id: card.id,
    name: card.name,
    sport: card.sport,
    subtitle: card.subtitle,
    positionKey: card.positionKey,
    rank: card.rank,
    honorZh: card.honors.zh,
    honorEn: card.honors.en,
    scores: card.scores,
    dimIds: card.dimIds,
    overall: card.overall,
    digits: card.overallDigits ?? 1,
    kitNumber: card.kitNumber,
    photo: photoFor(card.sport, card.id),
    takes: card.takes.map((take) => ({ zh: take.zh, en: take.en })),
  };
}

const people: Record<string, Slim> = {};
for (const person of [...activePlayers, ...legendPlayers]) {
  people[`${person.sport}:${person.id}`] = slim(presentPlayer(person));
}

const teams: Record<
  string,
  Slim & { roster: { id: string; name: string; positionKey?: string; kitNumber?: string; overall?: number; photo?: string }[] }
> = {};

const boards: Record<"players" | "teams" | "legends", Record<string, string[]>> = {
  players: {},
  teams: {},
  legends: {},
};

for (const sport of SPORTS) {
  boards.players[sport] = honorBoard("players", sport).map((card) => card.id);
  boards.legends[sport] = honorBoard("legends", sport).map((card) => card.id);
  boards.teams[sport] = honorBoard("teams", sport).map((card) => card.id);
}

for (const club of honorTeams) {
  const full = presentTeam(club, [], { withTakes: true });
  teams[`${club.sport}:${club.id}`] = {
    ...slim(full),
    roster: playersOnClub(club.id).map((player) => ({
      id: player.id,
      name: player.name,
      positionKey: player.positionKey,
      kitNumber: player.kitNumber,
      overall: player.fcRating,
      photo: photoFor(player.sport, player.id),
    })),
  };
}

const catalog = {
  sports: [...SPORTS],
  sportLabels,
  roleLabels: { zh: positionRoleLabels.zh, en: positionRoleLabels.en },
  dimLabels: { zh: positionDimLabels.zh, en: positionDimLabels.en },
  teamDims,
  people,
  teams,
  boards,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "catalog.json"), JSON.stringify(catalog));

const photos = new Set<string>();
for (const person of Object.values(people)) if (person.photo) photos.add(person.photo);
for (const team of Object.values(teams)) {
  for (const member of team.roster) if (member.photo) photos.add(member.photo);
}
const lines = [
  "/* Generated by scripts/export-mobile-catalog.ts. */",
  "import type { ImageSourcePropType } from 'react-native';",
  "",
  "export const portraits: Record<string, ImageSourcePropType> = {",
];
for (const rel of [...photos].sort()) {
  lines.push(`  ${JSON.stringify(rel)}: require(${JSON.stringify("../../public/portraits/" + rel)}),`);
}
lines.push("};", "");
writeFileSync(join(root, "mobile", "src", "portraits.ts"), lines.join("\n"));

const brandDir = join(root, "mobile", "assets");
mkdirSync(brandDir, { recursive: true });
copyFileSync(join(root, "public", "brand-mark.jpg"), join(brandDir, "brand-mark.jpg"));

function pair(value: { zh?: string; en?: string } | undefined) {
  return { zh: value?.zh ?? "", en: value?.en ?? "" };
}

const slimEvents = events.map((event) => ({
  id: event.id,
  slug: event.slug,
  sport: event.sport,
  leagueSlug: event.leagueSlug ?? null,
  title: pair(event.title),
  subtitle: pair(event.subtitle),
  venue: pair(event.venue),
  summary: pair(event.summary),
  startAt: event.startAt,
  status: event.status,
  home: event.homeTeamName ?? null,
  away: event.awayTeamName ?? null,
  homeScore: event.homeScore ?? null,
  awayScore: event.awayScore ?? null,
  players: event.performances.map((performance) => {
    const athlete = event.roster?.[performance.athleteId] ?? athletes[performance.athleteId];
    return {
      id: performance.athleteId,
      name: athlete?.name ?? performance.athleteId,
      team: athlete?.team ?? "",
      positionKey: performance.positionKey,
      role: pair(performance.role),
      result: pair(performance.result),
      highlight: pair(performance.highlight),
      stats: performance.stats.map((stat) => ({ label: pair(stat.label), value: stat.value })),
      scores: performance.communityAvg,
      count: performance.ratingCount,
    };
  }),
}));

writeFileSync(join(outDir, "events.json"), JSON.stringify(slimEvents));
writeFileSync(
  join(outDir, "weights.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(POSITION_PROFILES).map(([key, profile]) => [
        key,
        { dimensions: profile.dimensions, weights: profile.weights },
      ]),
    ),
  ),
);

console.log(
  `people ${Object.keys(people).length} teams ${Object.keys(teams).length} photos ${photos.size} events ${slimEvents.length}`,
);
