import type { Locale } from "@/lib/types";

const labels: Record<Locale, Record<string, string>> = {
  en: {
    nba: "NBA",
    lol: "LoL",
    cs2: "CS2",
    dota2: "Dota 2",
    valorant: "Valorant",
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    bundesliga: "Bundesliga",
    "serie-a": "Serie A",
    "ligue-1": "Ligue 1",
    "champions-league": "Champions League",
  },
  zh: {
    nba: "NBA",
    lol: "英雄联盟",
    cs2: "CS2",
    dota2: "Dota 2",
    valorant: "无畏契约",
    "premier-league": "英超",
    "la-liga": "西甲",
    bundesliga: "德甲",
    "serie-a": "意甲",
    "ligue-1": "法甲",
    "champions-league": "欧冠",
  },
  es: {
    nba: "NBA",
    lol: "LoL",
    cs2: "CS2",
    dota2: "Dota 2",
    valorant: "Valorant",
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    bundesliga: "Bundesliga",
    "serie-a": "Serie A",
    "ligue-1": "Ligue 1",
    "champions-league": "Champions League",
  },
  ja: {
    nba: "NBA",
    lol: "LoL",
    cs2: "CS2",
    dota2: "Dota 2",
    valorant: "Valorant",
    "premier-league": "プレミア",
    "la-liga": "ラ・リーガ",
    bundesliga: "ブンデス",
    "serie-a": "セリエA",
    "ligue-1": "リーグ1",
    "champions-league": "UCL",
  },
};

export function leagueLabel(locale: Locale, slug: string): string {
  return labels[locale][slug] ?? labels.en[slug] ?? slug;
}
