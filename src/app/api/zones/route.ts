import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  FOOD_DIMENSION_PRESET,
  normalizeDimensions,
  uniqueZoneSlug,
  type RatingZoneRow,
} from "@/lib/zones";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ zones: [] });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 48);
  const category = searchParams.get("category")?.trim();

  const supabase = await createClient();
  let q = supabase
    .from("rating_zones")
    .select(
      "id, slug, owner_id, title, description, cover_url, category, dimensions, heat_score, item_count, rating_count, published, created_at, updated_at",
    )
    .eq("published", true)
    .order("heat_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (category) q = q.eq("category", category);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const zones = (data ?? []).map((z) => ({
    ...z,
    dimensions: normalizeDimensions(z.dimensions),
  })) as RatingZoneRow[];

  return NextResponse.json({ zones });
}

type CreateBody = {
  title: string;
  description?: string;
  coverUrl?: string;
  category?: string;
  dimensions?: { id?: string; label: string }[] | string[];
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as CreateBody;
  const title = body.title?.trim();
  if (!title || title.length < 2) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const dimensions = normalizeDimensions(body.dimensions ?? FOOD_DIMENSION_PRESET);
  const category = body.category?.trim().slice(0, 32) || "food";
  const slugBase = uniqueZoneSlug(title);
  let slug = slugBase;
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("rating_zones")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = uniqueZoneSlug(title, String(Date.now()).slice(-4));
  }

  const { data, error } = await supabase
    .from("rating_zones")
    .insert({
      slug,
      owner_id: user.id,
      title: title.slice(0, 80),
      description: body.description?.trim().slice(0, 400) || null,
      cover_url: body.coverUrl?.trim() || null,
      category,
      dimensions,
      heat_score: 0,
    })
    .select("id, slug, title")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ zone: data });
}
