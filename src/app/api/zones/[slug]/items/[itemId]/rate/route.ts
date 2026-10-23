import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { refreshItemHeat } from "@/lib/zone-server";
import { normalizeDimensions } from "@/lib/zones";
import type { ScoreMap } from "@/lib/types";
import { NextResponse } from "next/server";

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
    .select("id, dimensions")
    .eq("slug", slug)
    .maybeSingle();
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const { data: item } = await supabase
    .from("zone_items")
    .select("id, zone_id")
    .eq("id", itemId)
    .eq("zone_id", zone.id)
    .maybeSingle();
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = (await request.json()) as { scores?: ScoreMap };
  const dimensions = normalizeDimensions(zone.dimensions);
  const dimIds = dimensions.map((d) => d.id);
  const scores = body.scores ?? {};
  for (const id of dimIds) {
    const v = scores[id];
    if (v == null || v < 0 || v > 10) {
      return NextResponse.json({ error: "Invalid scores." }, { status: 400 });
    }
  }

  const { error } = await supabase.from("zone_ratings").upsert(
    {
      user_id: user.id,
      zone_id: zone.id,
      item_id: itemId,
      scores,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshItemHeat(supabase, itemId, zone.id);

  return NextResponse.json({ ok: true });
}
