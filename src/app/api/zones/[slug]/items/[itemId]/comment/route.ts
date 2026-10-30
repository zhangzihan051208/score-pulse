import { moderateComment } from "@/lib/ai-moderation";
import { commentLocaleForInsert } from "@/lib/comment-translate";
import { moderationErrorPayload } from "@/lib/comment-moderation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { refreshItemHeat } from "@/lib/zone-server";
import { NextResponse } from "next/server";
import type { ScoreMap } from "@/lib/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { slug, itemId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: zone } = await supabase
    .from("rating_zones")
    .select("id, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const { data: item } = await supabase
    .from("zone_items")
    .select("id")
    .eq("id", itemId)
    .eq("zone_id", zone.id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    comment?: string;
    scores?: ScoreMap;
    displayName?: string;
  };
  const trimmed = body.comment?.trim() ?? "";
  if (trimmed.length > 0 && trimmed.length < 8) {
    return NextResponse.json(
      { error: "Comment must be at least 8 characters." },
      { status: 400 },
    );
  }

  let author = body.displayName?.trim().slice(0, 32);
  if (!author) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    author =
      profile?.display_name?.trim() ||
      user.email?.split("@")[0] ||
      "Fan";
  }

  const mod = await moderateComment(trimmed || "—");
  if (!mod.pass) {
    return NextResponse.json(moderationErrorPayload(mod), { status: 422 });
  }
  const moderation_status = mod.status;

  const { data: row, error } = await supabase
    .from("comments")
    .insert({
      user_id: user.id,
      event_id: `zone:${zone.id}`,
      athlete_id: itemId,
      zone_id: zone.id,
      zone_item_id: itemId,
      author,
      body: trimmed || "—",
      body_locale: commentLocaleForInsert(trimmed || "—"),
      scores: body.scores ?? null,
      moderation_status,
    })
    .select("id, moderation_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshItemHeat(supabase, itemId, zone.id);

  return NextResponse.json({
    ok: true,
    comment: row,
  });
}
