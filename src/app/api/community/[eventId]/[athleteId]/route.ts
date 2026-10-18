import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";
import type { ScoreMap } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string; athleteId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ comments: [], ratings: [], mine: null });
  }

  const { eventId, athleteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: comments }, { data: ratings }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, author, body, scores, created_at, user_id")
      .eq("event_id", eventId)
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ratings")
      .select("user_id, scores, updated_at")
      .eq("event_id", eventId)
      .eq("athlete_id", athleteId),
  ]);

  const mine =
    user && ratings
      ? ratings.find((r) => r.user_id === user.id)?.scores ?? null
      : null;

  return NextResponse.json({
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      author: c.author ?? "Fan",
      body: c.body,
      createdAt: c.created_at,
      scores: c.scores as ScoreMap | undefined,
      remote: true as const,
      userId: c.user_id,
    })),
    ratingCount: ratings?.length ?? 0,
    mine,
  });
}
