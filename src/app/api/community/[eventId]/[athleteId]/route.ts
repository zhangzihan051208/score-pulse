import { blockedUserIds } from "@/lib/safety-server";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { enrichTakesWithSocial } from "@/lib/comment-enrich";
import {
  attachTranslationToTakes,
  localizeCommentBodies,
} from "@/lib/comment-translate";
import { viewerLocaleFromRequest } from "@/lib/viewer-locale";
import { crestBadgeFromProfileRow } from "@/lib/profile-crest";
import { mergeTakes } from "@/lib/community-takes";
import { weightedAverageScores } from "@/lib/score-aggregate";
import {
  isVipActive,
  VIP_RATING_WEIGHT,
  STANDARD_RATING_WEIGHT,
} from "@/lib/vip";
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
  const viewerLocale = viewerLocaleFromRequest(request);
  const { searchParams } = new URL(request.url);
  const positionKey = (searchParams.get("positionKey") ??
    "nba.guard") as PositionKey;
  const dimIds =
    POSITION_PROFILES[positionKey]?.dimensions ?? dimensionIds("nba.guard");

  const { supabase, user } = await requestUser(request);
  if (!supabase) {
    return NextResponse.json({
      takes: [],
      mine: null,
      mineComment: "",
      communityAvg: null,
      ratingCount: 0,
    });
  }

  const [{ data: comments }, { data: ratings }] = await Promise.all([
    supabase
      .from("comments")
      .select(
        "id, author, body, body_translations, scores, created_at, user_id, parent_id, hidden, moderation_status",
      )
      .eq("event_id", eventId)
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("ratings")
      .select("user_id, scores, updated_at")
      .eq("event_id", eventId)
      .eq("athlete_id", athleteId)
      .order("updated_at", { ascending: false }),
  ]);

  const hidden = await blockedUserIds(supabase, user?.id);
  const visibleComments = (comments ?? []).filter((row) => !hidden.has(row.user_id));
  const visibleRatings = (ratings ?? []).filter((row) => !hidden.has(row.user_id));

  const userIds = [
    ...new Set([
      ...visibleRatings.map((r) => r.user_id),
      ...visibleComments.map((c) => c.user_id),
    ]),
  ];
  const profileMap = new Map<string, string>();
  const vipMap = new Map<string, boolean>();
  const crestMap = new Map<string, { url: string; name: string }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, vip_until, favorite_teams, hide_primary_crest")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.display_name ?? "Fan");
      vipMap.set(p.id, isVipActive(p.vip_until));
      const crest = crestBadgeFromProfileRow(p);
      if (crest) crestMap.set(p.id, crest);
    }
  }

  const allComments = visibleComments.filter(
    (c) => c.moderation_status === "approved" || !c.moderation_status,
  );
  const localized = await localizeCommentBodies(
    allComments.map((c) => ({
      id: c.id,
      body: c.body,
      user_id: c.user_id,
      body_translations: c.body_translations,
    })),
    viewerLocale,
    user?.id,
  );
  const commentRows = allComments
    .filter((c) => !c.parent_id)
    .map((c) => ({
      id: c.id,
      userId: c.user_id,
      author: c.author ?? profileMap.get(c.user_id) ?? "Fan",
      body: localized.get(c.id)?.body ?? c.body,
      createdAt: c.created_at,
      scores: c.scores as ScoreMap | undefined,
      isYou: user?.id === c.user_id,
    }));

  const ratingRows = visibleRatings.map((r) => ({
    userId: r.user_id,
    author: profileMap.get(r.user_id) ?? "Fan",
    scores: r.scores as ScoreMap,
    updatedAt: r.updated_at,
    isYou: user?.id === r.user_id,
  }));

  const merged = mergeTakes(ratingRows, commentRows);
  const baseTakes = merged.map((t) => {
    const crest = crestMap.get(t.userId);
    return {
      userId: t.userId,
      author: t.author,
      scores: t.scores,
      updatedAt: t.updatedAt,
      body: t.body ?? "",
      isYou: t.isYou,
      primaryCrestUrl: crest?.url ?? null,
      primaryCrestName: crest?.name ?? null,
    };
  });

  const commentIds = allComments.map((c) => c.id);
  const likeCountById = new Map<string, number>();
  const likedByYou = new Set<string>();
  if (commentIds.length > 0) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds.slice(0, 200));
    for (const like of likes ?? []) {
      likeCountById.set(
        like.comment_id,
        (likeCountById.get(like.comment_id) ?? 0) + 1,
      );
      if (user?.id === like.user_id) likedByYou.add(like.comment_id);
    }
  }

  const takes = attachTranslationToTakes(
    enrichTakesWithSocial(
      baseTakes,
      allComments.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        author: c.author,
        body: localized.get(c.id)?.body ?? c.body,
        created_at: c.created_at,
        parent_id: c.parent_id,
        hidden: c.hidden,
      })),
      likeCountById,
      likedByYou,
      user?.id,
    ),
    localized,
  );

  const weightedRows = takes.map((take) => ({
    scores: take.scores,
    weight: vipMap.get(take.userId) ? VIP_RATING_WEIGHT : STANDARD_RATING_WEIGHT,
  }));
  const communityAvg = weightedAverageScores(weightedRows, [...dimIds]);

  const mineTake = user ? takes.find((t) => t.isYou) : undefined;

  return NextResponse.json(
    {
      takes,
      ratingCount: takes.length,
      communityAvg,
      mine: mineTake?.scores ?? null,
      mineComment:
        allComments.find((c) => c.user_id === user?.id && !c.parent_id)?.body ??
        mineTake?.body ??
        "",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
