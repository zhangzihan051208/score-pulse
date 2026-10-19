import type { TeamSearchHit } from "@/lib/fixtures-sync";

/** Default hot weight when a club is in our tracked leagues but not in the table below. */
export const DEFAULT_HOT_WEIGHT = {
  nba: 62,
  soccer: 58,
  other: 40,
} as const;

type PopRecord = {
  canonical: string;
  sport: "nba" | "soccer";
  weight: number;
  aliases: string[];
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type PopInput = {
  canonical: string;
  sport: "nba" | "soccer";
  weight: number;
  aliases?: string[];
};

function buildRecords(entries: PopInput[]): PopRecord[] {
  return entries.map((e) => ({
    canonical: e.canonical,
    sport: e.sport,
    weight: e.weight,
    aliases: [norm(e.canonical), ...(e.aliases ?? []).map(norm)],
  }));
}

/** Curated default hot weights (global fan interest proxy). */
export const POPULAR_TEAMS: PopRecord[] = buildRecords([
  // NBA — all 30
  { canonical: "Los Angeles Lakers", sport: "nba", weight: 100, aliases: ["lakers", "湖人", "la lakers"] },
  { canonical: "Golden State Warriors", sport: "nba", weight: 98, aliases: ["warriors", "勇士", "gsw"] },
  { canonical: "Boston Celtics", sport: "nba", weight: 97, aliases: ["celtics", "凯尔特人", "绿军"] },
  { canonical: "Chicago Bulls", sport: "nba", weight: 88, aliases: ["bulls", "公牛"] },
  { canonical: "Miami Heat", sport: "nba", weight: 86, aliases: ["heat", "热火"] },
  { canonical: "New York Knicks", sport: "nba", weight: 85, aliases: ["knicks", "尼克斯"] },
  { canonical: "Brooklyn Nets", sport: "nba", weight: 78, aliases: ["nets", "篮网"] },
  { canonical: "Dallas Mavericks", sport: "nba", weight: 84, aliases: ["mavericks", "mavs", "独行侠", "小牛"] },
  { canonical: "Phoenix Suns", sport: "nba", weight: 80, aliases: ["suns", "太阳"] },
  { canonical: "Los Angeles Clippers", sport: "nba", weight: 79, aliases: ["clippers", "快船"] },
  { canonical: "Denver Nuggets", sport: "nba", weight: 82, aliases: ["nuggets", "掘金"] },
  { canonical: "Milwaukee Bucks", sport: "nba", weight: 83, aliases: ["bucks", "雄鹿"] },
  { canonical: "Philadelphia 76ers", sport: "nba", weight: 81, aliases: ["76ers", "sixers", "76人"] },
  { canonical: "Cleveland Cavaliers", sport: "nba", weight: 77, aliases: ["cavaliers", "cavs", "骑士"] },
  { canonical: "Memphis Grizzlies", sport: "nba", weight: 72, aliases: ["grizzlies", "灰熊"] },
  { canonical: "Sacramento Kings", sport: "nba", weight: 70, aliases: ["kings", "国王"] },
  { canonical: "New Orleans Pelicans", sport: "nba", weight: 68, aliases: ["pelicans", "鹈鹕"] },
  { canonical: "Minnesota Timberwolves", sport: "nba", weight: 74, aliases: ["timberwolves", "wolves", "森林狼"] },
  { canonical: "Oklahoma City Thunder", sport: "nba", weight: 76, aliases: ["thunder", "okc", "雷霆"] },
  { canonical: "San Antonio Spurs", sport: "nba", weight: 75, aliases: ["spurs", "马刺"] },
  { canonical: "Houston Rockets", sport: "nba", weight: 73, aliases: ["rockets", "火箭"] },
  { canonical: "Atlanta Hawks", sport: "nba", weight: 69, aliases: ["hawks", "老鹰"] },
  { canonical: "Toronto Raptors", sport: "nba", weight: 71, aliases: ["raptors", "猛龙"] },
  { canonical: "Indiana Pacers", sport: "nba", weight: 67, aliases: ["pacers", "步行者"] },
  { canonical: "Orlando Magic", sport: "nba", weight: 66, aliases: ["magic", "魔术"] },
  { canonical: "Detroit Pistons", sport: "nba", weight: 64, aliases: ["pistons", "活塞"] },
  { canonical: "Charlotte Hornets", sport: "nba", weight: 63, aliases: ["hornets", "黄蜂"] },
  { canonical: "Washington Wizards", sport: "nba", weight: 62, aliases: ["wizards", "奇才"] },
  { canonical: "Portland Trail Blazers", sport: "nba", weight: 65, aliases: ["blazers", "trail blazers", "开拓者"] },
  { canonical: "Utah Jazz", sport: "nba", weight: 64, aliases: ["jazz", "爵士"] },

  // Soccer — top clubs across tracked leagues
  { canonical: "Real Madrid", sport: "soccer", weight: 100, aliases: ["real", "皇马", "皇家马德里"] },
  { canonical: "FC Barcelona", sport: "soccer", weight: 99, aliases: ["barcelona", "barca", "巴萨", "巴塞罗那"] },
  { canonical: "Manchester United", sport: "soccer", weight: 97, aliases: ["man united", "man utd", "manchester utd", "曼联", "红魔"] },
  { canonical: "Liverpool", sport: "soccer", weight: 96, aliases: ["liverpool fc", "利物浦", "红军"] },
  { canonical: "Manchester City", sport: "soccer", weight: 95, aliases: ["man city", "曼城", "蓝月"] },
  { canonical: "Arsenal", sport: "soccer", weight: 92, aliases: ["arsenal fc", "阿森纳", "枪手"] },
  { canonical: "Chelsea", sport: "soccer", weight: 91, aliases: ["chelsea fc", "切尔西", "蓝军"] },
  { canonical: "Tottenham Hotspur", sport: "soccer", weight: 85, aliases: ["tottenham", "spurs", "热刺"] },
  { canonical: "Bayern Munich", sport: "soccer", weight: 94, aliases: ["bayern", "拜仁", "拜仁慕尼黑"] },
  { canonical: "Borussia Dortmund", sport: "soccer", weight: 88, aliases: ["dortmund", "bvb", "多特", "多特蒙德"] },
  { canonical: "Paris Saint-Germain", sport: "soccer", weight: 93, aliases: ["psg", "paris sg", "巴黎", "巴黎圣日耳曼"] },
  { canonical: "Juventus", sport: "soccer", weight: 90, aliases: ["juve", "尤文", "尤文图斯"] },
  { canonical: "Inter Milan", sport: "soccer", weight: 89, aliases: ["inter", "internazionale", "国米", "国际米兰"] },
  { canonical: "AC Milan", sport: "soccer", weight: 87, aliases: ["milan", "ac milan", "米兰", "ac米兰"] },
  { canonical: "Napoli", sport: "soccer", weight: 82, aliases: ["ssc napoli", "那不勒斯"] },
  { canonical: "AS Roma", sport: "soccer", weight: 78, aliases: ["roma", "罗马"] },
  { canonical: "Atletico Madrid", sport: "soccer", weight: 86, aliases: ["atletico", "马竞", "马德里竞技"] },
  { canonical: "Sevilla", sport: "soccer", weight: 72, aliases: ["sevilla fc", "塞维利亚"] },
  { canonical: "Valencia", sport: "soccer", weight: 68, aliases: ["valencia cf", "瓦伦西亚"] },
  { canonical: "Newcastle United", sport: "soccer", weight: 80, aliases: ["newcastle", "纽卡", "纽卡斯尔"] },
  { canonical: "Aston Villa", sport: "soccer", weight: 74, aliases: ["villa", "阿斯顿维拉"] },
  { canonical: "West Ham United", sport: "soccer", weight: 70, aliases: ["west ham", "西汉姆"] },
  { canonical: "Everton", sport: "soccer", weight: 66, aliases: ["everton fc", "埃弗顿"] },
  { canonical: "Leicester City", sport: "soccer", weight: 65, aliases: ["leicester", "莱斯特城"] },
  { canonical: "RB Leipzig", sport: "soccer", weight: 76, aliases: ["leipzig", "莱比锡"] },
  { canonical: "Bayer Leverkusen", sport: "soccer", weight: 75, aliases: ["leverkusen", "勒沃库森", "药厂"] },
  { canonical: "Olympique Marseille", sport: "soccer", weight: 73, aliases: ["marseille", "om", "马赛"] },
  { canonical: "Olympique Lyon", sport: "soccer", weight: 71, aliases: ["lyon", "ol", "里昂"] },
  { canonical: "AS Monaco", sport: "soccer", weight: 69, aliases: ["monaco", "摩纳哥"] },
  { canonical: "Benfica", sport: "soccer", weight: 77, aliases: ["sl benfica", "本菲卡"] },
  { canonical: "Porto", sport: "soccer", weight: 72, aliases: ["fc porto", "波尔图"] },
  { canonical: "Ajax", sport: "soccer", weight: 74, aliases: ["afc ajax", "阿贾克斯"] },
  { canonical: "Celtic", sport: "soccer", weight: 67, aliases: ["celtic fc", "凯尔特人"] },
  { canonical: "Rangers", sport: "soccer", weight: 66, aliases: ["rangers fc", "流浪者"] },
  { canonical: "Galatasaray", sport: "soccer", weight: 70, aliases: ["gala", "加拉塔萨雷"] },
  { canonical: "Fenerbahce", sport: "soccer", weight: 68, aliases: ["fener", "费内巴切"] },
]);

const aliasToRecord = new Map<string, PopRecord>();
for (const rec of POPULAR_TEAMS) {
  for (const a of rec.aliases) {
    if (!aliasToRecord.has(a)) aliasToRecord.set(a, rec);
  }
  aliasToRecord.set(norm(rec.canonical), rec);
}

export function resolvePopTeam(name: string): PopRecord | undefined {
  const n = norm(name);
  if (aliasToRecord.has(n)) return aliasToRecord.get(n);
  for (const rec of POPULAR_TEAMS) {
    if (n.includes(norm(rec.canonical)) || norm(rec.canonical).includes(n)) {
      return rec;
    }
  }
  return undefined;
}

export function hotWeightForTeam(name: string, sport: "nba" | "soccer"): number {
  const rec = resolvePopTeam(name);
  if (rec && rec.sport === sport) return rec.weight;
  if (rec) return Math.round(rec.weight * 0.85);
  return DEFAULT_HOT_WEIGHT[sport];
}

/** Text relevance 0–1000 (0 = no match). */
export function teamQueryRelevance(query: string, teamName: string): number {
  const q = norm(query);
  if (q.length < 1) return 0;
  const name = norm(teamName);
  if (!name) return 0;

  const rec = resolvePopTeam(teamName);
  if (rec) {
    for (const a of rec.aliases) {
      if (a === q) return 1000;
      if (a.startsWith(q) && q.length >= 2) return 920;
      if (q.length >= 2 && a.includes(q)) return 860;
    }
  }

  if (name === q) return 980;
  if (name.startsWith(q)) return 880;
  if (q.length >= 2 && name.includes(q)) return 720;

  const qTokens = q.split(" ").filter(Boolean);
  const nameTokens = name.split(" ");
  for (const qt of qTokens) {
    if (qt.length < 2) continue;
    if (nameTokens.some((t) => t.startsWith(qt))) return 680;
  }

  return 0;
}

export function rankTeamSearchHits(query: string, teams: TeamSearchHit[]): TeamSearchHit[] {
  const q = query.trim();
  if (!q) return teams;

  return [...teams]
    .map((team) => {
      const relevance = teamQueryRelevance(q, team.name);
      const hot = hotWeightForTeam(team.name, team.sport);
      const score = relevance > 0 ? relevance * 100 + hot : hot * 0.15;
      return { team, score, relevance, hot };
    })
    .filter((row) => row.relevance > 0)
    .sort((a, b) => b.score - a.score || b.hot - a.hot || a.team.name.localeCompare(b.team.name))
    .map((row) => row.team);
}

export function popularTeamsMatchingQuery(query: string, limit = 8): PopRecord[] {
  const q = norm(query);
  if (q.length < 1) return [];
  const hits: { rec: PopRecord; relevance: number }[] = [];

  for (const rec of POPULAR_TEAMS) {
    let best = 0;
    for (const a of rec.aliases) {
      if (a === q) best = Math.max(best, 1000);
      else if (a.startsWith(q) && q.length >= 1) best = Math.max(best, 850);
      else if (q.length >= 2 && a.includes(q)) best = Math.max(best, 700);
      else if (q.length >= 2 && q.includes(a) && a.length >= 3) best = Math.max(best, 650);
    }
    if (best > 0) hits.push({ rec, relevance: best });
  }

  return hits
    .sort((a, b) => b.relevance * 100 + b.rec.weight - (a.relevance * 100 + a.rec.weight))
    .slice(0, limit)
    .map((h) => h.rec);
}

export function matchSearchBoost(
  query: string,
  sport: "nba" | "soccer",
  home?: string | null,
  away?: string | null,
): number {
  const homeR = home ? teamQueryRelevance(query, home) : 0;
  const awayR = away ? teamQueryRelevance(query, away) : 0;
  const rel = Math.max(homeR, awayR);
  if (rel === 0) return 0;
  const hot = Math.max(
    home ? hotWeightForTeam(home, sport) : 0,
    away ? hotWeightForTeam(away, sport) : 0,
  );
  return rel + hot * 0.5;
}
