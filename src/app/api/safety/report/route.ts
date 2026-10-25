import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

const REASONS = new Set(["spam", "abuse", "other"]);

type Body = {
  reason?: string;
  targetUserId?: string;
  commentId?: string;
  eventId?: string;
  excerpt?: string;
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

  const body = (await request.json()) as Body;
  const reason = body.reason ?? "other";
  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Unknown reason" }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_user_id: body.targetUserId || null,
    comment_id: body.commentId || null,
    event_id: body.eventId?.slice(0, 120) || null,
    excerpt: body.excerpt?.trim().slice(0, 280) || null,
    reason,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
