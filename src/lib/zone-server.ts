import { heatFromCounts } from "@/lib/zone-heat";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function refreshItemHeat(
  supabase: SupabaseClient,
  itemId: string,
  zoneId: string,
) {
  const [{ count: ratingCount }, { data: comments }, { data: ratings }] =
    await Promise.all([
      supabase
        .from("zone_ratings")
        .select("*", { count: "exact", head: true })
        .eq("item_id", itemId),
      supabase
        .from("comments")
        .select("id")
        .eq("zone_item_id", itemId)
        .eq("moderation_status", "approved")
        .is("parent_id", null),
      supabase.from("zone_ratings").select("user_id").eq("item_id", itemId),
    ]);

  const commentIds = (comments ?? []).map((c) => c.id);
  let likes = 0;
  if (commentIds.length > 0) {
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .in("comment_id", commentIds.slice(0, 200));
    likes = count ?? 0;
  }

  const heat = heatFromCounts({
    ratings: ratingCount ?? 0,
    comments: commentIds.length,
    likes,
  });

  await supabase
    .from("zone_items")
    .update({
      heat_score: heat,
      rating_count: ratingCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  await refreshZoneHeat(supabase, zoneId);
}

export async function refreshZoneHeat(supabase: SupabaseClient, zoneId: string) {
  const { data: items } = await supabase
    .from("zone_items")
    .select("heat_score, rating_count, hidden")
    .eq("zone_id", zoneId)
    .eq("hidden", false);

  const itemHeat = (items ?? []).reduce((a, i) => a + Number(i.heat_score), 0);
  const ratingCount = (items ?? []).reduce((a, i) => a + (i.rating_count ?? 0), 0);

  const { count: pendingComments } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("zone_id", zoneId)
    .eq("moderation_status", "approved");

  const heat =
    itemHeat +
    heatFromCounts({ comments: Math.min(pendingComments ?? 0, 500) });

  await supabase
    .from("rating_zones")
    .update({
      heat_score: Math.round(heat * 10) / 10,
      item_count: items?.length ?? 0,
      rating_count: ratingCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", zoneId);
}
