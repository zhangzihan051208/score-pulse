import { overallScore } from "@/lib/data";
import {
  dimensionIds,
  POSITION_PROFILES,
  type PositionKey,
} from "@/lib/position-ratings";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ScoreMap, Sport } from "@/lib/types";
import { NextResponse } from "next/server";

export type ProfileRatingItem = {
  eventId: string;
  athleteId: string;
  sport: Sport;
  athleteName: string;
  teamName?: string;
  photoUrl?: string;
  eventSlug?: string;
  eventTitle?: string;
  eventDate?: string;
  overall: number;
  scores: ScoreMap;
  ratingMode: "full" | "overall_only";
  positionKey: PositionKey;
  updatedAt: string;
};

function positionFor(sport: Sport, key?: string | null): PositionKey {
  if (key && key in POSITION_PROFILES) return key as PositionKey;
  if (sport === "esports") return "esports.player";
  if (sport === "soccer") return "soccer.midfielder";
  if (sport === "nba") return "nba.guard";
  if (sport === "nfl") return "nfl.quarterback";
  if (sport === "f1") return "f1.driver";
  if (sport === "tennis") return "tennis.player";
  if (sport === "ufc") return "ufc.striker";
  return "nba.guard";
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("ratings")
    .select("event_id, athlete_id, sport, scores, rating_mode, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ratings = rows ?? [];
  if (ratings.length === 0) {
    return NextResponse.json({ items: [] as ProfileRatingItem[] });
  }

  const eventIds = [...new Set(ratings.map((r) => r.event_id))];

  const profileMap = new Map<
    string,
    {
      display_name: string;
      team_name: string | null;
      photo_url: string | null;
      position_key: string | null;
    }
  >();

  for (const sport of [...new Set(ratings.map((r) => r.sport))]) {
    const ids = ratings.filter((r) => r.sport === sport).map((r) => r.athlete_id);
    const { data: profiles } = await supabase
      .from("athlete_profiles")
      .select("athlete_id, display_name, team_name, photo_url, position_key")
      .eq("sport", sport)
      .in("athlete_id", [...new Set(ids)].slice(0, 100));
    for (const p of profiles ?? []) {
      profileMap.set(`${sport}:${p.athlete_id}`, p);
    }
  }

  const fixtureMap = new Map<
    string,
    { slug: string | null; str_event: string | null; date_event: string | null }
  >();
  const { data: fixtures } = await supabase
    .from("sportsdb_fixtures")
    .select("id_event, slug, str_event, date_event")
    .in("id_event", eventIds.slice(0, 100));
  for (const f of fixtures ?? []) {
    fixtureMap.set(f.id_event, f);
  }

  const items: ProfileRatingItem[] = ratings.map((row) => {
    const sport = row.sport as Sport;
    const profile = profileMap.get(`${sport}:${row.athlete_id}`);
    const fixture = fixtureMap.get(row.event_id);
    const positionKey = positionFor(sport, profile?.position_key);
    const scores = row.scores as ScoreMap;
    const mode =
      row.rating_mode === "overall_only" ? "overall_only" : "full";

    return {
      eventId: row.event_id,
      athleteId: row.athlete_id,
      sport,
      athleteName: profile?.display_name ?? row.athlete_id,
      teamName: profile?.team_name ?? undefined,
      photoUrl: profile?.photo_url ?? undefined,
      eventSlug: fixture?.slug ?? undefined,
      eventTitle: fixture?.str_event ?? undefined,
      eventDate: fixture?.date_event ?? undefined,
      overall: overallScore(scores, positionKey),
      scores,
      ratingMode: mode,
      positionKey,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ items });
}
