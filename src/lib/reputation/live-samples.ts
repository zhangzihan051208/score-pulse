import { events } from "@/lib/data";
import { playerDimIds, projectToSport } from "@/lib/reputation/blend";
import { findHonorPlayer, honorTeams } from "@/lib/reputation/catalog";
import type { HonorPlayer } from "@/lib/reputation/types";
import { weightedAverageScores } from "@/lib/score-aggregate";
import { SPORT_DIMENSIONS } from "@/lib/sports";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SPORTS, type ScoreMap, type Sport } from "@/lib/types";
import {
  isVipActive,
  STANDARD_RATING_WEIGHT,
  VIP_RATING_WEIGHT,
} from "@/lib/vip";

const seededEventIds = new Set(events.map((event) => event.id));

type RatingRow = {
  user_id: string;
  event_id: string;
  athlete_id: string;
  sport: string;
  scores: ScoreMap;
};

function isSport(value: string): value is Sport {
  return (SPORTS as readonly string[]).includes(value);
}

function meanPresent(samples: ScoreMap[], dims: readonly string[]): ScoreMap | null {
  const out: ScoreMap = {};
  for (const dim of dims) {
    const values = samples
      .map((sample) => sample[dim])
      .filter((n): n is number => typeof n === "number");
    if (!values.length) continue;
    out[dim] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * One community average per match, keyed by honor id.
 * In-memory seed cards are skipped so they are not counted twice.
 */
export async function loadLiveHonorSamples(sport: Sport | "all"): Promise<{
  byPlayer: Map<string, ScoreMap[]>;
  byTeam: Map<string, ScoreMap[]>;
}> {
  const byPlayer = new Map<string, ScoreMap[]>();
  const byTeam = new Map<string, ScoreMap[]>();
  if (!isSupabaseConfigured()) return { byPlayer, byTeam };

  const supabase = await createClient();
  let query = supabase
    .from("ratings")
    .select("user_id, event_id, athlete_id, sport, scores");
  if (sport !== "all") query = query.eq("sport", sport);
  const { data } = await query.order("updated_at", { ascending: false }).limit(400);
  const rows = ((data ?? []) as RatingRow[]).filter(
    (row) => isSport(row.sport) && !seededEventIds.has(row.event_id),
  );
  if (!rows.length) return { byPlayer, byTeam };

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const weightByUser = new Map<string, number>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, vip_until")
      .in("id", userIds.slice(0, 500));
    for (const profile of profiles ?? []) {
      weightByUser.set(
        profile.id,
        isVipActive(profile.vip_until) ? VIP_RATING_WEIGHT : STANDARD_RATING_WEIGHT,
      );
    }
  }

  const resolved = new Map<string, HonorPlayer>();
  const unresolved = new Map<Sport, Set<string>>();
  for (const row of rows) {
    const sportKey = row.sport as Sport;
    const direct = findHonorPlayer(sportKey, row.athlete_id);
    if (direct) {
      resolved.set(`${sportKey}:${row.athlete_id}`, direct);
      continue;
    }
    const set = unresolved.get(sportKey) ?? new Set<string>();
    set.add(row.athlete_id);
    unresolved.set(sportKey, set);
  }

  for (const [sportKey, ids] of unresolved) {
    const list = [...ids];
    for (let i = 0; i < list.length; i += 150) {
      const chunk = list.slice(i, i + 150);
      const { data: athletes } = await supabase
        .from("athlete_profiles")
        .select("athlete_id, display_name")
        .eq("sport", sportKey)
        .in("athlete_id", chunk);
      for (const athlete of athletes ?? []) {
        if (!athlete.display_name) continue;
        const hit = findHonorPlayer(sportKey, athlete.display_name);
        if (hit) resolved.set(`${sportKey}:${athlete.athlete_id}`, hit);
      }
    }
  }

  const buckets = new Map<
    string,
    { player: HonorPlayer; eventId: string; rows: { scores: ScoreMap; weight: number }[] }
  >();
  for (const row of rows) {
    const person = resolved.get(`${row.sport}:${row.athlete_id}`);
    if (!person) continue;
    const key = `${person.id}:${row.event_id}`;
    const bucket = buckets.get(key) ?? { player: person, eventId: row.event_id, rows: [] };
    bucket.rows.push({
      scores: row.scores,
      weight: weightByUser.get(row.user_id) ?? STANDARD_RATING_WEIGHT,
    });
    buckets.set(key, bucket);
  }

  const teamBuckets = new Map<string, ScoreMap[]>();
  for (const bucket of buckets.values()) {
    const avg = weightedAverageScores(bucket.rows, playerDimIds(bucket.player.positionKey));
    if (!avg) continue;
    const list = byPlayer.get(bucket.player.id) ?? [];
    list.push(avg);
    byPlayer.set(bucket.player.id, list);

    if (!bucket.player.clubId || bucket.player.era !== "active") continue;
    const projected = projectToSport(
      bucket.player.positionKey,
      avg,
      bucket.player.sport,
    );
    const teamKey = `${bucket.player.clubId}:${bucket.eventId}`;
    const projectedList = teamBuckets.get(teamKey) ?? [];
    projectedList.push(projected);
    teamBuckets.set(teamKey, projectedList);
  }

  for (const [teamKey, maps] of teamBuckets) {
    const split = teamKey.lastIndexOf(":");
    const clubId = teamKey.slice(0, split);
    const team = honorTeams.find((club) => club.id === clubId);
    if (!team) continue;
    const avg = meanPresent(maps, SPORT_DIMENSIONS[team.sport]);
    if (!avg) continue;
    const list = byTeam.get(clubId) ?? [];
    list.push(avg);
    byTeam.set(clubId, list);
  }

  return { byPlayer, byTeam };
}
