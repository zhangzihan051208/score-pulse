import { averageScores } from "@/lib/score-aggregate";
import { localizeCommentsForViewer } from "@/lib/comment-translate";
import { localeFromRequest } from "@/lib/request-locale";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeDimensions } from "@/lib/zones";
import type { ScoreMap } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { slug, itemId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: zone } = await supabase
    .from("rating_zones")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!zone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: item } = await supabase
    .from("zone_items")
    .select("*")
    .eq("id", itemId)
    .eq("zone_id", zone.id)
    .maybeSingle();

  if (!item || item.hidden) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dimensions = normalizeDimensions(zone.dimensions);
  const dimIds = dimensions.map((d) => d.id);

  const { data: ratings } = await supabase
    .from("zone_ratings")
    .select("user_id, scores, updated_at")
    .eq("item_id", itemId);

  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id, author, body, body_locale, translations, scores, created_at, user_id, moderation_status, parent_id, hidden",
    )
    .eq("zone_item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(80);

  const isOwner = user?.id === zone.owner_id;
  const visibleComments = (comments ?? []).filter((c) => {
    if (c.hidden) return false;
    if (c.moderation_status === "rejected") return false;
    if (c.moderation_status === "approved" || !c.moderation_status) return true;
    return isOwner || c.user_id === user?.id;
  });

  const communityAvg = averageScores(
    (ratings ?? []).map((r) => r.scores as ScoreMap),
    dimIds,
  );

  const mine = user
    ? (ratings ?? []).find((r) => r.user_id === user.id)
    : undefined;

  const localized = await localizeCommentsForViewer(
    visibleComments.map((c) => ({
      id: c.id,
      body: c.body,
      body_locale: c.body_locale,
      translations: c.translations as Record<string, string> | null,
    })),
    localeFromRequest(request),
  );

  return NextResponse.json({
    zone: {
      id: zone.id,
      slug: zone.slug,
      title: zone.title,
      dimensions,
      isOwner,
    },
    item,
    communityAvg,
    ratingCount: ratings?.length ?? 0,
    mine: (mine?.scores as ScoreMap | undefined) ?? null,
    comments: visibleComments.map((c) => {
      const loc = localized.get(c.id);
      const isYou = c.user_id === user?.id;
      return {
      id: c.id,
      author: c.author,
      body: isYou ? c.body : (loc?.body ?? c.body),
      bodyOriginal: isYou ? undefined : loc?.bodyOriginal,
      bodyLocale: isYou ? undefined : loc?.bodyLocale,
      isTranslated: isYou ? false : loc?.isTranslated,
      createdAt: c.created_at,
      moderationStatus: c.moderation_status,
      isYou: c.user_id === user?.id,
      pending: c.moderation_status === "pending",
    };
    }),
  });
}
