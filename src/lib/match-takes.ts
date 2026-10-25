import { L } from "@/lib/copy";
import type { Localized } from "@/lib/types";

/** A fan's score for the match itself — one number, not five axes. */
export type MatchTake = {
  id: string;
  eventId: string;
  author: string;
  score: number;
  body: string;
  createdAt: string;
  local: true;
};

export type SeedMatchTake = {
  id: string;
  eventId: string;
  author: string;
  score: number;
  body: Localized;
  createdAt: string;
};

export const seedMatchTakes: SeedMatchTake[] = [
  {
    id: "m-bav-1",
    eventId: "bayern-arsenal-ucl-2026",
    author: "stand-112",
    score: 8,
    createdAt: "2026-10-21T21:55:00+02:00",
    body: L(
      "Both sides scored the goals they should have. It only felt like a European night in the last eight minutes.",
      "两队都进了该进的球。最后八分钟才像一场欧冠。",
      "Los dos marcaron lo que tenían que marcar. Solo pareció noche europea en los últimos ocho minutos.",
      "両チームとも入るべき点が入った。欧州の夜らしくなったのは最後の8分。",
    ),
  },
  {
    id: "m-bav-2",
    eventId: "bayern-arsenal-ucl-2026",
    author: "northbank-away",
    score: 7.5,
    createdAt: "2026-10-21T21:52:00+02:00",
    body: L(
      "2-2 is fair. The stadium went quiet for too long after the penalty.",
      "2-2 公平。点球之后，安联安静得太久了。",
      "El 2-2 es justo. El estadio se quedó callado demasiado tiempo después del penalti.",
      "2-2は妥当。PKのあと、アリアンツが長すぎるほど静かだった。",
    ),
  },
  {
    id: "m-lal-1",
    eventId: "lal-bos",
    author: "row-c",
    score: 8.5,
    createdAt: "2026-10-18T22:10:00-07:00",
    body: L(
      "The fourth quarter is the game. The first three were a shootaround with a crowd.",
      "第四节才是这场球。前三节像带着观众的投篮训练。",
      "El último cuarto es el partido. Los tres primeros fueron un calentamiento con público.",
      "第4Qが試合。最初の3Qは観客付きのシュート練習だった。",
    ),
  },
  {
    id: "m-rma-1",
    eventId: "rma-mci",
    author: "bernabeu-late",
    score: 6.5,
    createdAt: "2026-10-20T22:40:00+02:00",
    body: L(
      "Lots of the ball, very few shots. A knockout first half does not earn a high mark for that.",
      "球权很多，射门很少。淘汰赛的上半场不该因为控球拿高分。",
      "Mucha pelota y pocos tiros. Una primera parte de eliminatoria no se paga por la posesión.",
      "保持は多いがシュートは少ない。決勝トーナメントの前半を保持で高くはつけない。",
    ),
  },
  {
    id: "m-monaco-1",
    eventId: "monaco-gp",
    author: "pit-lane",
    score: 8,
    createdAt: "2026-10-24T15:40:00+02:00",
    body: L(
      "Still hard to pass on the streets. The restart after the red flag was the part worth staying for.",
      "街道上还是很难超车。红旗之后的重启，才值得留下来看。",
      "Sigue siendo difícil adelantar en la calle. El relanzamiento tras la bandera roja sí merecía quedarse.",
      "市街地は相変わらず抜けない。赤旗のあとの再スタートが残る価値だった。",
    ),
  },
  {
    id: "m-rg-1",
    eventId: "rg-final",
    author: "court-philippe",
    score: 9,
    createdAt: "2026-10-19T18:20:00+02:00",
    body: L(
      "Five sets is the right length for this final. Each set had one break that should be remembered.",
      "这场决赛就该打满五盘。每一盘都有一次值得记住的破发。",
      "Cinco sets es la duración justa de esta final. Cada set tuvo un break para recordar.",
      "この決勝はフルセットが正しい。各セットに覚えるべきブレイクが一つあった。",
    ),
  },
  {
    id: "m-ufc-1",
    eventId: "ufc-314",
    author: "cage-side",
    score: 7.5,
    createdAt: "2026-10-24T23:10:00-04:00",
    body: L(
      "The first round on the feet was the fight. The clinch held the next two rounds down.",
      "站着打的第一回合才是这场。后面两回合被缠斗拖住了。",
      "El primer asalto de pie fue la pelea. El clinch frenó los dos siguientes.",
      "立った初回がこの試合。次の2Rはクリンチに押さえた。",
    ),
  },
];
