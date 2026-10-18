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

  const trimmedComment = comment?.trim() ?? "";
  if (trimmedComment.length > 0 && trimmedComment.length < 8) {
    return NextResponse.json(
      { error: "Comment must be at least 8 characters, or leave it blank." },
      { status: 400 },
    );
  }

  if (!scores || typeof scores !== "object" || Object.keys(scores).length === 0) {
    return NextResponse.json({ error: "Scores are required." }, { status: 400 });
  }

  let authorName: string | undefined = displayName?.trim().slice(0, 32);
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (authorName) {
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: authorName,
      updated_at: new Date().toISOString(),
    });
  } else if (existingProfile?.display_name?.trim()) {
    authorName = existingProfile.display_name.trim();
  } else {
    authorName =
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Fan";
  }
  const author = authorName ?? "Fan";

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

  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("athlete_id", athleteId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (trimmedComment.length >= 8) {
    const { error: commentError } = await supabase.from("comments").insert({
      user_id: user.id,
      event_id: eventId,
      athlete_id: athleteId,
      author: author.slice(0, 32),
      body: trimmedComment,
      scores,
    });
    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
