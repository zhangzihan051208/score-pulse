import type { Locale } from "./catalog";

export type SeedMatchTake = {
  id: string;
  eventId: string;
  author: string;
  score: number;
  zh: string;
  en: string;
  at: string;
};

export const seedMatchTakes: SeedMatchTake[] = [
  {
    id: "m-bav-1",
    eventId: "bayern-arsenal-ucl-2026",
    author: "stand-112",
    score: 8,
    at: "2026-10-21T21:55:00+02:00",
    zh: "两队都进了该进的球。最后八分钟才像一场欧冠。",
    en: "Both sides scored the goals they should have. It only felt like a European night in the last eight minutes.",
  },
  {
    id: "m-bav-2",
    eventId: "bayern-arsenal-ucl-2026",
    author: "northbank-away",
    score: 7.5,
    at: "2026-10-21T21:52:00+02:00",
    zh: "2-2 公平。点球之后，安联安静得太久了。",
    en: "2-2 is fair. The stadium went quiet for too long after the penalty.",
  },
  {
    id: "m-lal-1",
    eventId: "lal-bos",
    author: "row-c",
    score: 8.5,
    at: "2026-10-18T22:10:00-07:00",
    zh: "第四节才是这场球。前三节像带着观众的投篮训练。",
    en: "The fourth quarter is the game. The first three were a shootaround with a crowd.",
  },
  {
    id: "m-rma-1",
    eventId: "rma-mci",
    author: "bernabeu-late",
    score: 6.5,
    at: "2026-10-20T22:40:00+02:00",
    zh: "球权很多，射门很少。淘汰赛的上半场不该因为控球拿高分。",
    en: "Lots of the ball, very few shots. A knockout first half does not earn a high mark for that.",
  },
  {
    id: "m-monaco-1",
    eventId: "monaco-gp",
    author: "pit-lane",
    score: 8,
    at: "2026-10-24T15:40:00+02:00",
    zh: "街道上还是很难超车。红旗之后的重启，才值得留下来看。",
    en: "Still hard to pass on the streets. The restart after the red flag was the part worth staying for.",
  },
  {
    id: "m-rg-1",
    eventId: "rg-final",
    author: "court-philippe",
    score: 9,
    at: "2026-10-19T18:20:00+02:00",
    zh: "这场决赛就该打满五盘。每一盘都有一次值得记住的破发。",
    en: "Five sets is the right length for this final. Each set had one break that should be remembered.",
  },
  {
    id: "m-ufc-1",
    eventId: "ufc-314",
    author: "cage-side",
    score: 7.5,
    at: "2026-10-24T23:10:00-04:00",
    zh: "站着打的第一回合才是这场。后面两回合被缠斗拖住了。",
    en: "The first round on the feet was the fight. The clinch held the next two rounds down.",
  },
];

export function seedText(locale: Locale, take: SeedMatchTake) {
  return locale === "zh" ? take.zh : take.en;
}
