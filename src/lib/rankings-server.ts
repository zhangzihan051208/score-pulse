import { overallScore } from "@/lib/data";
import {
  findHonorPlayer,
  presentPlayer,
  seedMatchSamples,
} from "@/lib/reputation/catalog";
import { blendScores, playerDimIds, playerOverall } from "@/lib/reputation/blend";
import { playerTimeline, type DossierFixture, type DossierRating } from "@/lib/reputation/dossier";
import { portraitFor } from "@/lib/reputation/portraits";
import {
  fetchAthleteProfileRow,
  fetchAthleteProfilesForTeam,
  type AthleteProfileRow,
} from "@/lib/athlete-profile-server";
import { weightedAverageScores } from "@/lib/score-aggregate";
import {
  dimensionIds,
  POSITION_PROFILES,
  type PositionKey,
} from "@/lib/position-ratings";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isVipActive,
  STANDARD_RATING_WEIGHT,
  VIP_RATING_WEIGHT,
} from "@/lib/vip";
import type { ReputationCard } from "@/lib/reputation/types";
import type { ScoreMap, Sport } from "@/lib/types";

type RatingRow = {
  user_id: string;
  event_id: string;
  athlete_id: string;
  sport: string;
  scores: ScoreMap;
};

export type RankingBoard = "overall" | "dimension";

export type LeaderboardEntry = {
  rank: number;
  athleteId: string;
  displayName: string;
  teamId?: string;
  teamName?: string;
  photoUrl?: string;
  sport: Sport;
  positionKey: PositionKey;
  ratingCount: number;
  overall: number;
  avg: ScoreMap;
  highlightDim?: string;
  highlightValue?: number;
};

export type PlayerEventRating = {
  eventId: string;
  eventSlug?: string;
  eventTitle?: string;
  eventDate?: string;
  ratingCount: number;
  overall: number;
  avg: ScoreMap;
};

const DEFAULT_POSITION: PositionKey = "nba.guard";

function positionForProfile(
  profile: AthleteProfileRow | null,
  sport: Sport,
): PositionKey {
  if (profile?.position_key) return profile.position_key as PositionKey;
  if (sport === "esports") return "esports.player";
  if (sport === "soccer") return "soccer.midfielder";
  return DEFAULT_POSITION;
}

async function loadRatings(opts: {
  sport?: Sport;
  athleteId?: string;
  limit?: number;
}): Promise<RatingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("ratings")
    .select("user_id, event_id, athlete_id, sport, scores");
  if (opts.sport) q = q.eq("sport", opts.sport);
  if (opts.athleteId) q = q.eq("athlete_id", opts.athleteId);
  const { data } = await q
    .order("updated_at", { ascending: false })
    .limit(opts.limit ?? 4000);
  return (data ?? []) as RatingRow[];
}

async function vipWeightByUser(userIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!isSupabaseConfigured() || userIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, vip_until")
    .in("id", userIds.slice(0, 500));
  for (const p of data ?? []) {
    map.set(
      p.id,
      isVipActive(p.vip_until) ? VIP_RATING_WEIGHT : STANDARD_RATING_WEIGHT,
    );
  }
  return map;
}

async function profileMapForAthletes(
  sport: Sport,
  athleteIds: string[],
): Promise<Map<string, AthleteProfileRow>> {
  const map = new Map<string, AthleteProfileRow>();
  if (!isSupabaseConfigured() || athleteIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_profiles")
    .select("sport, athlete_id, display_name, team_id, team_name, photo_url, position_key")
    .eq("sport", sport)
    .in("athlete_id", athleteIds.slice(0, 200));
  for (const row of (data ?? []) as AthleteProfileRow[]) {
    map.set(row.athlete_id, row);
  }
  return map;
}

function aggregateByAthlete(
  rows: RatingRow[],
  weightByUser: Map<string, number>,
  profileByAthlete: Map<string, AthleteProfileRow>,
  sport: Sport,
  board: RankingBoard,
  dimId?: string,
): Omit<LeaderboardEntry, "rank">[] {
  const byAthlete = new Map<
    string,
    { weighted: { scores: ScoreMap; weight: number }[]; count: number }
  >();

  for (const row of rows) {
    if (row.sport !== sport) continue;
    const bucket = byAthlete.get(row.athlete_id) ?? { weighted: [], count: 0 };
    bucket.weighted.push({
      scores: row.scores,
      weight: weightByUser.get(row.user_id) ?? STANDARD_RATING_WEIGHT,
    });
    bucket.count += 1;
    byAthlete.set(row.athlete_id, bucket);
  }

  const out: Omit<LeaderboardEntry, "rank">[] = [];

  for (const [athleteId, bucket] of byAthlete) {
    const profile = profileByAthlete.get(athleteId) ?? null;
    const positionKey = positionForProfile(profile, sport);
    const dimIds = [
      ...(POSITION_PROFILES[positionKey]?.dimensions ?? dimensionIds(positionKey)),
    ];
    const avg = weightedAverageScores(bucket.weighted, dimIds);
    if (!avg) continue;
    const overall = overallScore(avg, positionKey);
    const entry: Omit<LeaderboardEntry, "rank"> = {
      athleteId,
      displayName: profile?.display_name ?? athleteId,
      teamId: profile?.team_id ?? undefined,
      teamName: profile?.team_name ?? undefined,
      photoUrl: profile?.photo_url ?? undefined,
      sport,
      positionKey,
      ratingCount: bucket.count,
      overall,
      avg,
    };
    if (board === "dimension" && dimId && avg[dimId] != null) {
      entry.highlightDim = dimId;
      entry.highlightValue = avg[dimId];
    }
    out.push(entry);
  }

  out.sort((a, b) => {
    if (board === "dimension" && dimId) {
      const va = a.avg[dimId] ?? 0;
      const vb = b.avg[dimId] ?? 0;
      if (vb !== va) return vb - va;
    } else if (b.overall !== a.overall) return b.overall - a.overall;
    return b.ratingCount - a.ratingCount;
  });

  return out;
}

export async function buildGlobalLeaderboard(opts: {
  sport: Sport;
  board?: RankingBoard;
  dimId?: string;
  teamId?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const sport = opts.sport;
  const board = opts.board ?? "overall";
  const limit = Math.min(opts.limit ?? 50, 100);

  let athleteIdsFilter: Set<string> | null = null;
  if (opts.teamId) {
    const roster = await fetchAthleteProfilesForTeam(sport, opts.teamId);
    athleteIdsFilter = new Set(roster.map((r) => r.athlete_id));
    if (athleteIdsFilter.size === 0) {
      const { fetchTeamRoster } = await import("@/lib/thesportsdb");
      const tsdbRoster = await fetchTeamRoster(opts.teamId);
      for (const p of tsdbRoster) {
        if (p.idPlayer) athleteIdsFilter.add(p.idPlayer);
      }
    }
  }

  const rows = await loadRatings({ sport, limit: 5000 });
  const filtered =
    athleteIdsFilter != null
      ? rows.filter((r) => athleteIdsFilter!.has(r.athlete_id))
      : rows;

  const userIds = [...new Set(filtered.map((r) => r.user_id))];
  const weightByUser = await vipWeightByUser(userIds);
  const athleteIds = [...new Set(filtered.map((r) => r.athlete_id))];
  const profileByAthlete = await profileMapForAthletes(sport, athleteIds);

  for (const id of athleteIds) {
    if (profileByAthlete.has(id)) continue;
    const row = await fetchAthleteProfileRow(sport, id);
    if (row) profileByAthlete.set(id, row);
  }

  const aggregated = aggregateByAthlete(
    filtered,
    weightByUser,
    profileByAthlete,
    sport,
    board,
    opts.dimId,
  );

  return aggregated.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function buildPlayerEventRankings(
  sport: Sport,
  athleteId: string,
): Promise<{
  profile: AthleteProfileRow | null;
  careerOverall: number | null;
  careerAvg: ScoreMap | null;
  totalRatings: number;
  byEvent: PlayerEventRating[];
  reputation: ReputationCard | null;
  schedule: DossierFixture[];
  recentRatings: DossierRating[];
}> {
  const profile = await fetchAthleteProfileRow(sport, athleteId);
  const honor =
    findHonorPlayer(sport, athleteId) ??
    (profile?.display_name ? findHonorPlayer(sport, profile.display_name) : undefined);
  const positionKey = honor?.positionKey ?? positionForProfile(profile, sport);
  const dimIds = honor
    ? playerDimIds(positionKey)
    : [...(POSITION_PROFILES[positionKey]?.dimensions ?? dimensionIds(positionKey))];

  const rows = await loadRatings({ sport, athleteId, limit: 2000 });
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const weightByUser = await vipWeightByUser(userIds);

  const byEvent = new Map<string, { scores: ScoreMap; weight: number }[]>();
  for (const row of rows) {
    const list = byEvent.get(row.event_id) ?? [];
    list.push({
      scores: row.scores,
      weight: weightByUser.get(row.user_id) ?? STANDARD_RATING_WEIGHT,
    });
    byEvent.set(row.event_id, list);
  }

  const eventIds = [...byEvent.keys()];
  const fixturesByEvent = await loadFixtureMeta(eventIds);

  const eventRankings: PlayerEventRating[] = [];
  for (const [eventId, weighted] of byEvent) {
    const avg = weightedAverageScores(weighted, dimIds);
    if (!avg) continue;
    const meta = fixturesByEvent.get(eventId);
    eventRankings.push({
      eventId,
      eventSlug: meta?.slug,
      eventTitle: meta?.title,
      eventDate: meta?.date,
      ratingCount: weighted.length,
      overall: overallScore(avg, positionKey),
      avg,
    });
  }

  eventRankings.sort((a, b) => b.overall - a.overall);

  const careerWeighted = rows.map((r) => ({
    scores: r.scores,
    weight: weightByUser.get(r.user_id) ?? STANDARD_RATING_WEIGHT,
  }));
  const ratedAvg = weightedAverageScores(careerWeighted, dimIds);
  const matchAvgs = [
    ...seedMatchSamples(honor?.id ?? athleteId),
    ...eventRankings.map((row) => row.avg),
  ];

  let careerAvg = ratedAvg;
  let careerOverall = ratedAvg ? overallScore(ratedAvg, positionKey) : null;
  let totalRatings = rows.length;
  let reputation: ReturnType<typeof presentPlayer> | null = null;

  if (honor) {
    const blended = blendScores(honor.scores, honor.seedWeight, matchAvgs, dimIds);
    careerAvg = blended;
    careerOverall = playerOverall(blended, positionKey);
    totalRatings = honor.seedWeight + matchAvgs.length;
    reputation = presentPlayer(honor, eventRankings.map((row) => row.avg));
  }

  const timeline = honor ? playerTimeline(honor) : { schedule: [], recentRatings: [] };
  const communityRatings: DossierRating[] = eventRankings
    .filter((row) => row.eventDate)
    .map((row) => ({
      id: row.eventId,
      title: { en: row.eventTitle ?? row.eventId, zh: row.eventTitle ?? row.eventId },
      date: row.eventDate ?? "",
      overall: row.overall,
      href: row.eventSlug
        ? `/events/${row.eventSlug}/${encodeURIComponent(athleteId)}`
        : undefined,
      source: "match" as const,
    }));
  const recentRatings =
    communityRatings.length > 0
      ? communityRatings.sort((a, b) => b.date.localeCompare(a.date))
      : timeline.recentRatings;

  const resolvedProfile =
    profile ??
    (honor
      ? {
          sport,
          athlete_id: honor.id,
          display_name: honor.name,
          team_id: honor.clubId ? `honor-${honor.clubId}` : null,
          team_name: honor.team,
          photo_url: portraitFor(honor.sport, honor.id, honor.name),
          position_key: honor.positionKey,
        }
      : null);

  return {
    profile: resolvedProfile,
    careerOverall,
    careerAvg,
    totalRatings,
    byEvent: eventRankings,
    reputation,
    schedule: timeline.schedule,
    recentRatings,
  };
}

async function loadFixtureMeta(
  eventIds: string[],
): Promise<Map<string, { slug?: string; title?: string; date?: string }>> {
  const map = new Map<string, { slug?: string; title?: string; date?: string }>();
  if (!isSupabaseConfigured() || eventIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sportsdb_fixtures")
    .select("id_event, slug, str_event, date_event")
    .in("id_event", eventIds.slice(0, 150));
  for (const row of data ?? []) {
    map.set(row.id_event, {
      slug: row.slug ?? undefined,
      title: row.str_event ?? undefined,
      date: row.date_event ?? undefined,
    });
  }
  return map;
}

export function defaultDimensionForSport(sport: Sport): string {
  const key =
    sport === "esports"
      ? "esports.player"
      : sport === "soccer"
        ? "soccer.striker"
        : sport === "nba"
          ? "nba.guard"
          : `${sport}.player`;
  const dims =
    POSITION_PROFILES[key as PositionKey]?.dimensions ??
    dimensionIds(key as PositionKey);
  return dims[0] ?? "scoring";
}
