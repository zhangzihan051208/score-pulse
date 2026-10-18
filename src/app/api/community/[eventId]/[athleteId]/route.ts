import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mergeTakes, scoresForAggregation } from "@/lib/community-takes";
import { averageScores } from "@/lib/score-aggregate";
import {
  dimensionIds,
  POSITION_PROFILES,
  type PositionKey,
} from "@/lib/position-ratings";
import { NextResponse } from "next/server";
import type { ScoreMap } from "@/lib/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string; athleteId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      takes: [],
      mine: null,
      mineComment: "",
      communityAvg: null,
      ratingCount: 0,
    });
  }

  const { eventId, athleteId } = await context.params;
  const { searchParams } = new URL(request.url);
  const positionKey = (searchParams.get("positionKey") ??
    "nba.guard") as PositionKey;
  const dimIds =
    POSITION_PROFILES[positionKey]?.dimensions ?? dimensionIds("nba.guard");

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
      .limit(80),
    supabase
      .from("ratings")
      .select("user_id, scores, updated_at")
      .eq("event_id", eventId)
      .eq("athlete_id", athleteId)
      .order("updated_at", { ascending: false }),
  ]);

  const userIds = [
    ...new Set([
      ...(ratings ?? []).map((r) => r.user_id),
      ...(comments ?? []).map((c) => c.user_id),
    ]),
  ];
  const profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.display_name ?? "Fan");
    }
  }

  const commentRows = (comments ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    author: c.author ?? profileMap.get(c.user_id) ?? "Fan",
    body: c.body,
    createdAt: c.created_at,
    scores: c.scores as ScoreMap | undefined,
    isYou: user?.id === c.user_id,
  }));

  const ratingRows = (ratings ?? []).map((r) => ({
    userId: r.user_id,
    author: profileMap.get(r.user_id) ?? "Fan",
    scores: r.scores as ScoreMap,
    updatedAt: r.updated_at,
    isYou: user?.id === r.user_id,
  }));

  const takes = mergeTakes(ratingRows, commentRows);
  const scoreRows = scoresForAggregation(takes);
  const communityAvg = averageScores(scoreRows, [...dimIds]);

  const mineTake = user ? takes.find((t) => t.userId === user.id) : undefined;

  return NextResponse.json({
    takes: takes.map((t) => ({
      userId: t.userId,
      author: t.author,
      scores: t.scores,
      updatedAt: t.updatedAt,
      body: t.body ?? "",
      isYou: t.isYou,
    })),
    ratingCount: takes.length,
    communityAvg,
    mine: mineTake?.scores ?? null,
    mineComment: mineTake?.body ?? "",
  });
}
