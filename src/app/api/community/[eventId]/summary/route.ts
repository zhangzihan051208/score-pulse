import { mergeTakes } from "@/lib/community-takes";
import { localizeCommentBodies } from "@/lib/comment-translate";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { viewerLocaleFromRequest } from "@/lib/viewer-locale";
import { NextResponse } from "next/server";
import type { ScoreMap } from "@/lib/types";

export type SummaryTake = {
  userId: string;
  author: string;
  body?: string;
  scores: ScoreMap;
  updatedAt: string;
  isYou: boolean;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ takesByAthlete: {} as Record<string, SummaryTake[]> });
  }

  const { eventId } = await context.params;
  const viewerLocale = viewerLocaleFromRequest(request);
  const { supabase, user } = await requestUser(request);
  if (!supabase) {
    return NextResponse.json({ takesByAthlete: {} as Record<string, SummaryTake[]> });
  }

  const [{ data: comments }, { data: ratings }] = await Promise.all([
    supabase
      .from("comments")
      .select(
        "id, athlete_id, author, body, body_translations, scores, created_at, user_id, parent_id, hidden, moderation_status",
      )
      .eq("event_id", eventId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("ratings")
      .select("athlete_id, user_id, scores, updated_at")
      .eq("event_id", eventId)
      .order("updated_at", { ascending: false })
      .limit(400),
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
      .in("id", userIds.slice(0, 100));
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.display_name ?? "Fan");
    }
  }

  const visibleCommentRows = (comments ?? []).filter(
    (c) =>
      c.athlete_id &&
      !c.hidden &&
      (!c.moderation_status || c.moderation_status === "approved"),
  );
  const localized = await localizeCommentBodies(
    visibleCommentRows.map((c) => ({
      id: c.id,
      body: c.body,
      user_id: c.user_id,
      body_translations: c.body_translations,
    })),
    viewerLocale,
    user?.id,
  );

  const byAthlete = new Map<string, SummaryTake[]>();

  const push = (athleteId: string, row: SummaryTake) => {
    const list = byAthlete.get(athleteId) ?? [];
    list.push(row);
    byAthlete.set(athleteId, list);
  };

  for (const c of visibleCommentRows) {
    const loc = localized.get(c.id);
    push(c.athlete_id!, {
      userId: c.user_id,
      author: c.author ?? profileMap.get(c.user_id) ?? "Fan",
      body: loc?.body ?? c.body ?? undefined,
      scores: (c.scores as ScoreMap | null) ?? {},
      updatedAt: c.created_at,
      isYou: user?.id === c.user_id,
    });
  }

  for (const r of ratings ?? []) {
    if (!r.athlete_id) continue;
    push(r.athlete_id, {
      userId: r.user_id,
      author: profileMap.get(r.user_id) ?? "Fan",
      scores: r.scores as ScoreMap,
      updatedAt: r.updated_at,
      isYou: user?.id === r.user_id,
    });
  }

  const takesByAthlete: Record<string, SummaryTake[]> = {};
  for (const [athleteId, rows] of byAthlete) {
    const commentRows = rows
      .filter((r) => r.body?.trim())
      .map((r) => ({
        id: r.userId,
        userId: r.userId,
        author: r.author,
        body: r.body!,
        createdAt: r.updatedAt,
        scores: r.scores,
        isYou: r.isYou,
      }));
    const ratingRows = rows.map((r) => ({
      userId: r.userId,
      author: r.author,
      scores: r.scores,
      updatedAt: r.updatedAt,
      isYou: r.isYou,
    }));
    takesByAthlete[athleteId] = mergeTakes(ratingRows, commentRows).map((t) => ({
      userId: t.userId,
      author: t.author,
      body: t.body,
      scores: t.scores,
      updatedAt: t.updatedAt,
      isYou: t.isYou,
    }));
  }

  return NextResponse.json(
    { takesByAthlete },
    { headers: { "Cache-Control": "no-store" } },
  );
}
