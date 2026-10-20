import {
  FREE_FULL_RATINGS_PER_DAY,
  isVipActive,
  utcDayStartIso,
  type RatingMode,
} from "@/lib/vip";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchProfileVip(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ vipUntil: string | null; isVip: boolean }> {
  const { data } = await supabase
    .from("profiles")
    .select("vip_until")
    .eq("id", userId)
    .maybeSingle();
  const vipUntil = data?.vip_until ?? null;
  return { vipUntil, isVip: isVipActive(vipUntil) };
}

export async function countFullDimensionRatingsToday(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const dayStart = utcDayStartIso();
  const { data } = await supabase
    .from("ratings")
    .select("event_id, athlete_id")
    .eq("user_id", userId)
    .eq("rating_mode", "full")
    .gte("updated_at", dayStart);
  const keys = new Set(
    (data ?? []).map((r) => `${r.event_id}:${r.athlete_id}`),
  );
  return keys.size;
}

export async function canPostFullDimensions(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  athleteId: string,
): Promise<{
  allowed: boolean;
  isVip: boolean;
  fullToday: number;
  existingMode: RatingMode | null;
}> {
  const { isVip } = await fetchProfileVip(supabase, userId);
  if (isVip) {
    return { allowed: true, isVip: true, fullToday: 0, existingMode: null };
  }

  const { data: existing } = await supabase
    .from("ratings")
    .select("rating_mode")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  const existingMode = (existing?.rating_mode as RatingMode | null) ?? null;
  if (existingMode === "full") {
    const fullToday = await countFullDimensionRatingsToday(supabase, userId);
    return { allowed: true, isVip: false, fullToday, existingMode };
  }

  const fullToday = await countFullDimensionRatingsToday(supabase, userId);
  const key = `${eventId}:${athleteId}`;
  const dayStart = utcDayStartIso();
  const { data: rows } = await supabase
    .from("ratings")
    .select("event_id, athlete_id")
    .eq("user_id", userId)
    .eq("rating_mode", "full")
    .gte("updated_at", dayStart);

  const keys = new Set(
    (rows ?? []).map((r) => `${r.event_id}:${r.athlete_id}`),
  );
  const allowed = keys.has(key) || keys.size < FREE_FULL_RATINGS_PER_DAY;
  return { allowed, isVip: false, fullToday: keys.size, existingMode };
}

export async function buildVipQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<import("@/lib/types").VipQuota> {
  const { vipUntil, isVip } = await fetchProfileVip(supabase, userId);
  const fullToday = isVip
    ? 0
    : await countFullDimensionRatingsToday(supabase, userId);
  const remaining = isVip
    ? FREE_FULL_RATINGS_PER_DAY
    : Math.max(0, FREE_FULL_RATINGS_PER_DAY - fullToday);
  return {
    isVip,
    vipUntil,
    fullRatingsToday: fullToday,
    fullRatingsLimit: FREE_FULL_RATINGS_PER_DAY,
    fullRatingsRemaining: isVip ? 999 : remaining,
    canFullDimensions: isVip || fullToday < FREE_FULL_RATINGS_PER_DAY,
  };
}
