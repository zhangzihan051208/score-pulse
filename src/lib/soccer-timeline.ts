import { S } from "./copy";
import { fetchTimeline, type TsdbTimelineEvent } from "./thesportsdb";
import type { MatchEvent, Performance } from "./types";

export type PlayerMatchCounts = {
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  goalMinutes: number[];
  assistMinutes: number[];
  yellowMinutes: number[];
  redMinutes: number[];
};

const cache = new Map<string, { at: number; rows: TsdbTimelineEvent[] | null }>();
const CACHE_OK_MS = 90_000;
const CACHE_MISS_MS = 15_000;

function playerId(value: string | null | undefined) {
  const id = String(value ?? "").trim();
  if (!id || id === "0" || id.toLowerCase() === "null") return "";
  return id;
}

function minute(value: string | null | undefined) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function blank(): PlayerMatchCounts {
  return {
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0,
    goalMinutes: [],
    assistMinutes: [],
    yellowMinutes: [],
    redMinutes: [],
  };
}

function bucket(map: Map<string, PlayerMatchCounts>, id: string) {
  let row = map.get(id);
  if (!row) {
    row = blank();
    map.set(id, row);
  }
  return row;
}

function remember(list: number[], value: string | null | undefined) {
  const n = minute(value);
  if (n == null) return;
  list.push(n);
}

/** Counts from TheSportsDB's English timeline. Missed penalties are not goals. */
export function countsFromTimeline(rows: TsdbTimelineEvent[]) {
  const map = new Map<string, PlayerMatchCounts>();
  for (const row of rows) {
    const kind = (row.strTimeline ?? "").trim().toLowerCase();
    const detail = (row.strTimelineDetail ?? "").trim().toLowerCase();
    if (kind === "goal") {
      if (detail === "missed penalty") continue;
      const scorer = playerId(row.idPlayer);
      if (scorer) {
        const player = bucket(map, scorer);
        player.goals += 1;
        remember(player.goalMinutes, row.intTime);
      }
      if (detail !== "own goal") {
        const assist = playerId(row.idAssist);
        if (assist) {
          const player = bucket(map, assist);
          player.assists += 1;
          remember(player.assistMinutes, row.intTime);
        }
      }
      continue;
    }
    if (kind !== "card") continue;
    const booked = playerId(row.idPlayer);
    if (!booked) continue;
    const player = bucket(map, booked);
    const text = `${kind} ${detail}`;
    if (text.includes("red")) {
      player.red += 1;
      remember(player.redMinutes, row.intTime);
    } else if (text.includes("yellow")) {
      player.yellow += 1;
      remember(player.yellowMinutes, row.intTime);
    }
  }
  return map;
}

function minutesLabel(minutes: number[]) {
  if (minutes.length === 0) return undefined;
  return [...minutes].sort((a, b) => a - b).map((m) => `${m}'`).join(", ");
}

/** English labels in every locale. Names stay the English strings from the feed. */
export function soccerStatLines(counts?: PlayerMatchCounts): Performance["stats"] {
  const row = counts ?? blank();
  return [
    { label: S("Goals"), value: String(row.goals), detail: minutesLabel(row.goalMinutes) },
    { label: S("Assists"), value: String(row.assists), detail: minutesLabel(row.assistMinutes) },
    {
      label: S("Yellow cards"),
      value: String(row.yellow),
      detail: minutesLabel(row.yellowMinutes),
    },
    { label: S("Red cards"), value: String(row.red), detail: minutesLabel(row.redMinutes) },
  ];
}

async function loadMatchTimeline(idEvent: string) {
  const now = Date.now();
  const hit = cache.get(idEvent);
  if (hit && now - hit.at < (hit.rows ? CACHE_OK_MS : CACHE_MISS_MS)) return hit.rows;
  const rows = await fetchTimeline(idEvent);
  cache.set(idEvent, { at: now, rows });
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return rows;
}

/** Attaches goal, assist, and card counts for one soccer match. Not stored in the database. */
export async function withSoccerTimelineStats(event: MatchEvent): Promise<MatchEvent> {
  if (event.sport !== "soccer" || event.status === "upcoming") return event;
  if (!/^\d+$/.test(event.id) || event.performances.length === 0) return event;
  const rows = await loadMatchTimeline(event.id);
  if (!rows) return event;
  const counts = countsFromTimeline(rows);
  return {
    ...event,
    performances: event.performances.map((performance) => ({
      ...performance,
      stats: soccerStatLines(counts.get(performance.athleteId)),
    })),
  };
}
