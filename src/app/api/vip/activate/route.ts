import { fetchProfileVip } from "@/lib/vip-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

/** Demo checkout — extends VIP by 30 days. Wire Stripe in production. */
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

  const body = (await request.json().catch(() => ({}))) as { days?: number };
  const days = Math.min(Math.max(body.days ?? 30, 1), 365);

  const { vipUntil: current } = await fetchProfileVip(supabase, user.id);
  const base = current && new Date(current).getTime() > Date.now()
    ? new Date(current)
    : new Date();
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  const vipUntil = next.toISOString();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    vip_until: vipUntil,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vipUntil });
}
