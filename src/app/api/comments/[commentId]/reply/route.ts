import { moderateComment } from "@/lib/ai-moderation";
import { moderationErrorPayload } from "@/lib/comment-moderation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

type Body = { body: string };

export async function POST(
  request: Request,
  context: { params: Promise<{ commentId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { commentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { body } = (await request.json()) as Body;
  const text = body?.trim() ?? "";
  if (text.length < 2) {
    return NextResponse.json({ error: "Reply too short." }, { status: 400 });
  }

  const { data: parent } = await supabase
    .from("comments")
    .select("id, event_id, athlete_id, hidden")
    .eq("id", commentId)
    .maybeSingle();

  if (!parent || parent.hidden) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const mod = await moderateComment(text);
  if (!mod.pass) {
    return NextResponse.json(moderationErrorPayload(mod), { status: 422 });
  }

  const author =
    profile?.display_name?.trim() ||
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Fan";

  const { data: parentFull } = await supabase
    .from("comments")
    .select("zone_id, zone_item_id")
    .eq("id", commentId)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from("comments")
    .insert({
      user_id: user.id,
      event_id: parent.event_id,
      athlete_id: parent.athlete_id,
      author: author.slice(0, 32),
      body: text.slice(0, 500),
      parent_id: commentId,
      zone_id: parentFull?.zone_id ?? null,
      zone_item_id: parentFull?.zone_item_id ?? null,
      moderation_status: mod.status,
    })
    .select("id, author, body, created_at, user_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reply: row });
}
