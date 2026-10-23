import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: zone } = await supabase
    .from("rating_zones")
    .select("id, title, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!zone || zone.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: pending } = await supabase
    .from("comments")
    .select(
      "id, author, body, created_at, zone_item_id, moderation_status, user_id",
    )
    .eq("zone_id", zone.id)
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({ zone: { title: zone.title, slug }, pending: pending ?? [] });
}
