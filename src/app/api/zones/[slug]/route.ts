import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeDimensions } from "@/lib/zones";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { slug } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: zone, error } = await supabase
    .from("rating_zones")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  if (!zone.published && zone.owner_id !== user?.id) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("zone_items")
    .select(
      "id, zone_id, name, photo_url, blurb, heat_score, rating_count, created_at",
    )
    .eq("zone_id", zone.id)
    .eq("hidden", false)
    .order("heat_score", { ascending: false })
    .limit(80);

  return NextResponse.json({
    zone: {
      ...zone,
      dimensions: normalizeDimensions(zone.dimensions),
      isOwner: user?.id === zone.owner_id,
    },
    items: items ?? [],
  });
}
