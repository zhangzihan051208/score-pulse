import { overallScore } from "./score-display";
import { tx } from "./copy";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { resolveAthlete } from "./event-resolve";
import { dimensionIds } from "./position-ratings";
import { commentsFor, getUserRating, mergedAverages, overallFromScores } from "./store";
import type { CommunityState } from "./store";
import type { Athlete, Locale, MatchEvent, Performance } from "./types";

export type SpotlightPick = {
  side: "home" | "away";
  performance: Performance;
  athlete: Athlete;
  merged: NonNullable<ReturnType<typeof mergedAverages>>;
};

export function athleteSide(
  event: MatchEvent,
  athlete: Athlete,
): "home" | "away" | null {
  if (athlete.idTeam && event.homeTeamId && athlete.idTeam === event.homeTeamId) {
    return "home";
  }
  if (athlete.idTeam && event.awayTeamId && athlete.idTeam === event.awayTeamId) {
    return "away";
  }
  const homeAbbrev = event.homeTeamName?.slice(0, 3).toUpperCase();
  const awayAbbrev = event.awayTeamName?.slice(0, 3).toUpperCase();
  if (athlete.team && homeAbbrev && athlete.team === homeAbbrev) return "home";
  if (athlete.team && awayAbbrev && athlete.team === awayAbbrev) return "away";
  return null;
}

function isStarter(performance: Performance, locale: Locale): boolean {
  const sub = performance.result ? tx(performance.result, locale) : "";
  const folded = sub.toLowerCase();
  if (!folded) return true;
  return !(
    folded.includes("substitut") ||
    folded.includes("suplent") ||
    folded.includes("ersatz") ||
    sub.includes("替补") ||
    sub.includes("途中")
  );
}

function pickScore(
  event: MatchEvent,
  performance: Performance,
  merged: NonNullable<ReturnType<typeof mergedAverages>>,
  starter: boolean,
): number {
  const overall = overallScore(merged.avg, performance.positionKey);
  return merged.count * 100 + overall * 10 + (starter ? 50 : 0);
}

export type RosterEntry = {
  performance: Performance;
  athlete: Athlete;
  merged: NonNullable<ReturnType<typeof mergedAverages>>;
};

function shirtNumber(athlete: Athlete): number {
  const n = Number.parseInt(athlete.jerseyNumber ?? "", 10);
  return Number.isFinite(n) ? n : 999;
}

/** Ranked players first, then players the crowd has actually graded. */
export function compareRosterEntries(
  event: MatchEvent,
  a: RosterEntry,
  b: RosterEntry,
  locale: Locale,
): number {
  const heat = (b.performance.heat ?? 0) - (a.performance.heat ?? 0);
  if (heat !== 0) return heat;
  const starterA = isStarter(a.performance, locale);
  const starterB = isStarter(b.performance, locale);
  const score =
    pickScore(event, b.performance, b.merged, starterB) -
    pickScore(event, a.performance, a.merged, starterA);
  if (score !== 0) return score;
  const shirt = shirtNumber(a.athlete) - shirtNumber(b.athlete);
  if (shirt !== 0) return shirt;
  return a.athlete.name.localeCompare(b.athlete.name);
}

function sortRosterEntries(
  event: MatchEvent,
  list: RosterEntry[],
  locale: Locale,
): RosterEntry[] {
  return [...list].sort((a, b) => compareRosterEntries(event, a, b, locale));
}

export function performancesBySide(
  event: MatchEvent,
  state: CommunityState,
  locale: Locale,
): { home: RosterEntry[]; away: RosterEntry[] } {
  const home: RosterEntry[] = [];
  const away: RosterEntry[] = [];

  for (const p of event.performances) {
    const athlete = resolveAthlete(event, p.athleteId);
    const merged = mergedAverages(event, p.athleteId, state);
    if (!athlete || !merged) continue;
    const entry: RosterEntry = { performance: p, athlete, merged };
    const side = athleteSide(event, athlete);
    if (side === "away") away.push(entry);
    else home.push(entry);
  }

  if (away.length === 0 && home.length > 1) {
    const order: string[] = [];
    for (const entry of home) {
      const tag = entry.athlete.team?.trim();
      if (tag && !order.includes(tag)) order.push(tag);
    }
    if (order.length >= 2) {
      const homeTag = order[0]!;
      const rest = home.splice(0, home.length);
      for (const entry of rest) {
        if (entry.athlete.team?.trim() === homeTag) home.push(entry);
        else away.push(entry);
      }
    }
  }

  return {
    home: sortRosterEntries(event, home, locale),
    away: sortRosterEntries(event, away, locale),
  };
}

export function pickEventSpotlights(
  event: MatchEvent,
  state: CommunityState,
  locale: Locale,
): SpotlightPick[] {
  const buckets: { home: SpotlightPick[]; away: SpotlightPick[] } = {
    home: [],
    away: [],
  };

  for (const p of event.performances) {
    const athlete = resolveAthlete(event, p.athleteId);
    const merged = mergedAverages(event, p.athleteId, state);
    if (!athlete || !merged) continue;
    const side = athleteSide(event, athlete);
    if (!side) continue;
    buckets[side].push({ side, performance: p, athlete, merged });
  }

  const best = (list: SpotlightPick[]) =>
    [...list].sort((a, b) =>
      compareRosterEntries(
        event,
        { performance: a.performance, athlete: a.athlete, merged: a.merged },
        { performance: b.performance, athlete: b.athlete, merged: b.merged },
        locale,
      ),
    )[0];

  if (buckets.home.length === 0 && buckets.away.length === 0) {
    const byTeam = new Map<string, SpotlightPick[]>();
    for (const p of event.performances) {
      const athlete = resolveAthlete(event, p.athleteId);
      const merged = mergedAverages(event, p.athleteId, state);
      if (!athlete || !merged) continue;
      const tag = athlete.team ?? athlete.id;
      const list = byTeam.get(tag) ?? [];
      list.push({
        side: byTeam.size === 0 ? "home" : "away",
        performance: p,
        athlete,
        merged,
      });
      byTeam.set(tag, list);
    }
    const fallback: SpotlightPick[] = [];
    for (const list of byTeam.values()) {
      const pick = best(list);
      if (!pick) continue;
      fallback.push({ ...pick, side: fallback.length === 0 ? "home" : "away" });
      if (fallback.length >= 2) break;
    }
    return fallback;
  }

  const out: SpotlightPick[] = [];
  const home = best(buckets.home);
  const away = best(buckets.away);
  if (home) out.push(home);
  if (away) out.push(away);
  return out;
}

export function localTakesForAthlete(
  event: MatchEvent,
  athleteId: string,
  state: CommunityState,
  locale: Locale,
): CommunityTake[] {
  const positionKey =
    event.performances.find((p) => p.athleteId === athleteId)?.positionKey ??
    "nba.guard";
  const rating = getUserRating(state, event.id, athleteId);
  const rows: CommunityTake[] = [];
  if (rating) {
    rows.push({
      userId: "local",
      author: state.nickname,
      scores: rating.scores,
      updatedAt: rating.updatedAt,
      isYou: true,
    });
  }
  for (const c of commentsFor(event.id, athleteId, state)) {
    const isLocal = "local" in c && c.local;
    const body = isLocal
      ? c.body
      : "body" in c && typeof c.body === "object"
        ? tx(c.body, locale)
        : undefined;
    rows.push({
      userId: isLocal ? "local" : c.id,
      author: c.author,
      body,
      scores: c.scores ?? rating?.scores ?? {},
      updatedAt: c.createdAt,
      isYou: isLocal && c.author === state.nickname,
    });
  }
  return rows;
}

export function topEngagementTake(
  takes: CommunityTake[],
  positionKey: SpotlightPick["performance"]["positionKey"],
): CommunityTake | null {
  const withBody = takes.filter((t) => (t.body?.trim().length ?? 0) >= 8);
  const pool = withBody.length > 0 ? withBody : takes;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => {
    const scoreA =
      (a.body?.trim().length ?? 0) * 3 +
      overallFromScores(a.scores, positionKey) +
      (a.isYou ? 0 : 1);
    const scoreB =
      (b.body?.trim().length ?? 0) * 3 +
      overallFromScores(b.scores, positionKey) +
      (b.isYou ? 0 : 1);
    return scoreB - scoreA;
  })[0];
}

export function radarDimIds(positionKey: SpotlightPick["performance"]["positionKey"]) {
  return [...dimensionIds(positionKey)];
}
