import { overallScore } from "./data";
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
  return !sub.toLowerCase().includes("substitut") && sub !== "替补";
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

function sortRosterEntries(
  event: MatchEvent,
  list: RosterEntry[],
  locale: Locale,
): RosterEntry[] {
  return [...list].sort((a, b) => {
    const starterA = isStarter(a.performance, locale);
    const starterB = isStarter(b.performance, locale);
    if (starterA !== starterB) return starterA ? -1 : 1;
    const scoreA = pickScore(event, a.performance, a.merged, starterA);
    const scoreB = pickScore(event, b.performance, b.merged, starterB);
    return scoreB - scoreA;
  });
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

  if (buckets.home.length === 0 && buckets.away.length === 0) {
    const fallback: SpotlightPick[] = [];
    const teams = new Set<string>();
    for (const p of event.performances) {
      const athlete = resolveAthlete(event, p.athleteId);
      const merged = mergedAverages(event, p.athleteId, state);
      if (!athlete || !merged) continue;
      const tag = athlete.team ?? athlete.id;
      if (teams.has(tag)) continue;
      teams.add(tag);
      fallback.push({
        side: fallback.length === 0 ? "home" : "away",
        performance: p,
        athlete,
        merged,
      });
      if (fallback.length >= 2) break;
    }
    return fallback;
  }

  const best = (list: SpotlightPick[]) =>
    [...list].sort(
      (a, b) =>
        pickScore(event, b.performance, b.merged, isStarter(b.performance, locale)) -
        pickScore(event, a.performance, a.merged, isStarter(a.performance, locale)),
    )[0];

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
