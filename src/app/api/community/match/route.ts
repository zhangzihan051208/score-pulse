import { moderateComment } from "@/lib/ai-moderation";
import { commentLocaleForInsert, localizeCommentsForViewer } from "@/lib/comment-translate";
import { localeFromRequest } from "@/lib/request-locale";
import { moderationErrorPayload } from "@/lib/comment-moderation";
import { blockedUserIds } from "@/lib/safety-server";
import { requestUser, upsertRating, writeClient } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";
import type { Sport } from "@/lib/types";

const MATCH_ATHLETE_ID = "__match__";

function clampScore(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ takes: [], mine: null });
  }
  const eventId = new URL(request.url).searchParams.get("eventId")?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }
  const { supabase, user } = await requestUser(request);
  if (!supabase) {
    return NextResponse.json({ takes: [], mine: null });
  }
  const hidden = await blockedUserIds(supabase, user?.id);

  const [{ data: ratings }, { data: comments }] = await Promise.all([
    supabase
      .from("ratings")
      .select("user_id, scores, updated_at")
      .eq("event_id", eventId)
      .eq("athlete_id", MATCH_ATHLETE_ID),
    supabase
      .from("comments")
      .select(
        "id, user_id, author, body, body_locale, translations, created_at, hidden, moderation_status",
      )
      .eq("event_id", eventId)
      .eq("athlete_id", MATCH_ATHLETE_ID)
      .is("parent_id", null)
      .order("created_at", { ascending: false }),
  ]);

  const commentByUser = new Map(
    (comments ?? [])
      .filter((row) => !row.hidden && (row.moderation_status === "approved" || !row.moderation_status))
      .map((row) => [row.user_id, row]),
  );

  const viewerLocale = localeFromRequest(request);
  const commentRows = (comments ?? []).filter(
    (row) =>
      !row.hidden &&
      (row.moderation_status === "approved" || !row.moderation_status),
  );
  const localizedBodies = await localizeCommentsForViewer(
    commentRows.map((row) => ({
      id: row.id,
      body: row.body,
      body_locale: row.body_locale,
      translations: row.translations as Record<string, string> | null,
    })),
    viewerLocale,
  );

  const takes = (ratings ?? [])
    .filter((row) => !hidden.has(row.user_id))
    .map((row) => {
      const scores = row.scores as { match?: number } | null;
      const comment = commentByUser.get(row.user_id);
      const loc = comment ? localizedBodies.get(comment.id) : undefined;
      const isYou = user?.id === row.user_id;
      return {
        userId: row.user_id,
        author: comment?.author ?? "Fan",
        score: typeof scores?.match === "number" ? scores.match : 0,
        body: isYou ? (comment?.body ?? "") : (loc?.body ?? comment?.body ?? ""),
        bodyOriginal: isYou ? undefined : loc?.bodyOriginal,
        bodyLocale: isYou ? undefined : loc?.bodyLocale,
        isTranslated: isYou ? false : loc?.isTranslated,
        commentId: comment?.id,
        createdAt: comment?.created_at ?? row.updated_at,
        isYou,
      };
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json(
    {
      takes,
      mine: takes.find((take) => take.isYou) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { supabase, user } = await requestUser(request);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const db = writeClient(supabase);

  const body = (await request.json()) as {
    eventId?: string;
    sport?: Sport;
    score?: number;
    comment?: string;
    displayName?: string;
  };
  const eventId = body.eventId?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }
  const score = clampScore(Number(body.score));
  const comment = body.comment?.trim() ?? "";
  if (comment) {
    const verdict = await moderateComment(comment);
    if (!verdict.pass) {
      return NextResponse.json(moderationErrorPayload(verdict), { status: 422 });
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const author = (
    body.displayName?.trim() ||
    profile?.display_name ||
    user.email?.split("@")[0] ||
    "Fan"
  ).slice(0, 32);

  const { error: ratingError } = await upsertRating(db, {
    user_id: user.id,
    event_id: eventId,
    athlete_id: MATCH_ATHLETE_ID,
    sport: body.sport ?? "soccer",
    scores: { match: score },
    rating_mode: "overall_only",
    updated_at: new Date().toISOString(),
  });
  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 });
  }

  await db
    .from("comments")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("athlete_id", MATCH_ATHLETE_ID);

  if (comment) {
    const { error: commentError } = await db.from("comments").insert({
      user_id: user.id,
      event_id: eventId,
      athlete_id: MATCH_ATHLETE_ID,
      author,
      body: comment,
      body_locale: commentLocaleForInsert(comment),
      scores: { match: score },
      moderation_status: "approved",
    });
    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
