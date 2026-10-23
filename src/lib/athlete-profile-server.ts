import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PositionKey } from "@/lib/position-ratings";
import type { Sport } from "@/lib/types";
import { fetchPlayerById } from "@/lib/thesportsdb";

export type AthleteProfileRow = {
  sport: Sport;
  athlete_id: string;
  display_name: string;
  team_id: string | null;
  team_name: string | null;
  photo_url: string | null;
  position_key: PositionKey;
};

export type AthleteProfileUpsert = {
  sport: Sport;
  athleteId: string;
  displayName: string;
  teamId?: string | null;
  teamName?: string | null;
  photoUrl?: string | null;
  positionKey?: PositionKey;
};

export async function upsertAthleteProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: AthleteProfileUpsert,
) {
  const row = {
    sport: input.sport,
    athlete_id: input.athleteId,
    display_name: input.displayName.trim().slice(0, 120),
    team_id: input.teamId?.trim() || null,
    team_name: input.teamName?.trim() || null,
    photo_url: input.photoUrl?.trim() || null,
    position_key: input.positionKey ?? "nba.guard",
    updated_at: new Date().toISOString(),
  };
  await supabase.from("athlete_profiles").upsert(row, {
    onConflict: "sport,athlete_id",
  });
}

export async function fetchAthleteProfileRow(
  sport: Sport,
  athleteId: string,
): Promise<AthleteProfileRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_profiles")
    .select("sport, athlete_id, display_name, team_id, team_name, photo_url, position_key")
    .eq("sport", sport)
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (data) return data as AthleteProfileRow;

  if ((sport === "nba" || sport === "soccer") && /^\d+$/.test(athleteId)) {
    const p = await fetchPlayerById(athleteId);
    if (p?.strPlayer) {
      return {
        sport,
        athlete_id: athleteId,
        display_name: p.strPlayer,
        team_id: p.idTeam ?? null,
        team_name: p.strTeam ?? null,
        photo_url: p.strCutout ?? p.strThumb ?? null,
        position_key: sport === "soccer" ? "soccer.midfielder" : "nba.guard",
      };
    }
  }

  return null;
}

export async function fetchAthleteProfilesForTeam(
  sport: Sport,
  teamId: string,
): Promise<AthleteProfileRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_profiles")
    .select("sport, athlete_id, display_name, team_id, team_name, photo_url, position_key")
    .eq("sport", sport)
    .eq("team_id", teamId)
    .order("display_name", { ascending: true })
    .limit(80);
  return (data ?? []) as AthleteProfileRow[];
}
