import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export type ProfileZoneSummary = {
  slug: string;
  title: string;
  cover_url: string | null;
  category: string;
  heat_score: number;
  item_count: number;
  rating_count: number;
  published: boolean;
  updated_at: string;
};

export async function GET() {
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

  const { data: rows, error } = await supabase
    .from("rating_zones")
    .select(
      "slug, title, cover_url, category, heat_score, item_count, rating_count, published, updated_at, dimensions",
    )
    .eq("owner_id", user.id)
    .order("heat_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const zones: ProfileZoneSummary[] = (rows ?? []).map((z) => ({
    slug: z.slug,
    title: z.title,
    cover_url: z.cover_url,
    category: z.category,
    heat_score: Number(z.heat_score) || 0,
    item_count: z.item_count ?? 0,
    rating_count: z.rating_count ?? 0,
    published: z.published ?? true,
    updated_at: z.updated_at,
  }));

  const totalHeat = zones.reduce((acc, z) => acc + z.heat_score, 0);
  const totalItems = zones.reduce((acc, z) => acc + z.item_count, 0);
  const totalRatings = zones.reduce((acc, z) => acc + z.rating_count, 0);

  return NextResponse.json({
    zones,
    totals: {
      heat: Math.round(totalHeat * 10) / 10,
      zones: zones.length,
      items: totalItems,
      ratings: totalRatings,
    },
  });
}
