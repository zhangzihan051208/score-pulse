import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";
import type { PositionKey, ScoreMap, Sport } from "@/lib/types";

type Body = {
  eventId: string;
  athleteId: string;
  sport: Sport;
  positionKey?: PositionKey;
  scores: ScoreMap;
  comment?: string;
  displayName?: string;
};

export async function POST(request: Request) {
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

  const body = (await request.json()) as Body;
  const { eventId, athleteId, sport, scores, comment, displayName } = body;

  if (displayName?.trim()) {
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName.trim().slice(0, 32),
        updated_at: new Date().toISOString(),
      });
  }

  const { error: ratingError } = await supabase.from("ratings").upsert(
    {
      user_id: user.id,
      event_id: eventId,
      athlete_id: athleteId,
      sport,
      scores,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,event_id,athlete_id" },
  );

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 });
  }

  const author =
    displayName?.trim() ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Fan";

  if (comment?.trim()) {
    const { error: commentError } = await supabase.from("comments").insert({
      user_id: user.id,
      event_id: eventId,
      athlete_id: athleteId,
      author: author.slice(0, 32),
      body: comment.trim(),
      scores,
    });
    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
