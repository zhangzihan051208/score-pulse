import {
  dimensionIds,
  POSITION_PROFILES,
  type PositionKey,
} from "@/lib/position-ratings";
import { canPostFullDimensions } from "@/lib/vip-server";
import {
  scoresFromOverall,
  type RatingMode,
} from "@/lib/vip";
import { moderationErrorPayload, scanCommentBody } from "@/lib/comment-moderation";
import { upsertAthleteProfile } from "@/lib/athlete-profile-server";
import { requestUser, upsertRating, writeClient } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";
import type { ScoreMap, Sport } from "@/lib/types";

type Body = {
  eventId: string;
  athleteId: string;
  sport: Sport;
  positionKey?: PositionKey;
  scores: ScoreMap;
  ratingMode?: RatingMode;
  overall?: number;
  comment?: string;
  displayName?: string;
  athleteName?: string;
  teamId?: string;
  teamName?: string;
  photoUrl?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { supabase, user } = await requestUser(request);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const {
    eventId,
    athleteId,
    sport,
    comment,
    displayName,
    positionKey = "nba.guard",
  } = body;
  const ratingMode: RatingMode =
    body.ratingMode === "overall_only" ? "overall_only" : "full";

  const dimIds =
    POSITION_PROFILES[positionKey as PositionKey]?.dimensions ??
    dimensionIds(positionKey as PositionKey);

  let scores: ScoreMap = body.scores;
  if (ratingMode === "overall_only") {
    const overall =
      body.overall ??
      (dimIds.length ? scores[dimIds[0]!] : undefined) ??
      Object.values(scores)[0];
    if (overall == null || Number.isNaN(Number(overall))) {
      return NextResponse.json(
        { error: "Overall score is required for quick rating." },
        { status: 400 },
      );
    }
    scores = scoresFromOverall(Number(overall), [...dimIds]);
  }

  const gate = await canPostFullDimensions(
    supabase,
    user.id,
    eventId,
    athleteId,
  );
  if (ratingMode === "full" && !gate.allowed) {
    return NextResponse.json(
      {
        error: "Daily full rating limit reached. Use overall-only or upgrade to VIP.",
        code: "full_rating_limit",
      },
      { status: 403 },
    );
  }

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

  const db = writeClient(supabase);
  const { error: ratingError } = await upsertRating(db, {
    user_id: user.id,
    event_id: eventId,
    athlete_id: athleteId,
    sport,
    scores,
    rating_mode: ratingMode,
    updated_at: new Date().toISOString(),
  });

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 });
  }

  const athleteLabel = body.athleteName?.trim();
  if (athleteLabel) {
    await upsertAthleteProfile(db, {
      sport,
      athleteId,
      displayName: athleteLabel,
      teamId: body.teamId,
      teamName: body.teamName,
      photoUrl: body.photoUrl,
      positionKey: positionKey as PositionKey,
    });
  }

  const { error: deleteError } = await db
    .from("comments")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("athlete_id", athleteId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (trimmedComment.length >= 8) {
    const mod = scanCommentBody(trimmedComment);
    if (!mod.pass) {
      return NextResponse.json(moderationErrorPayload(mod), { status: 422 });
    }
    const { error: commentError } = await db.from("comments").insert({
      user_id: user.id,
      event_id: eventId,
      athlete_id: athleteId,
      author: author.slice(0, 32),
      body: trimmedComment,
      scores,
      moderation_status: mod.status,
    });
    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
