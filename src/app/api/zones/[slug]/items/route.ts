import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { HEAT } from "@/lib/zone-heat";
import { refreshZoneHeat } from "@/lib/zone-server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { slug } = await context.params;
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

  const body = (await request.json()) as {
    name?: string;
    photoUrl?: string;
    blurb?: string;
  };
  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from("zone_items")
    .insert({
      zone_id: zone.id,
      name: name.slice(0, 80),
      photo_url: body.photoUrl?.trim() || null,
      blurb: body.blurb?.trim().slice(0, 280) || null,
      created_by: user.id,
      heat_score: HEAT.newItem,
    })
    .select("id, name, photo_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshZoneHeat(supabase, zone.id);

  return NextResponse.json({ item });
}
