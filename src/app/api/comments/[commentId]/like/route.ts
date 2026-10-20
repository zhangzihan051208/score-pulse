import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
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

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
  } else {
    const { error } = await supabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: user.id,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { count } = await supabase
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId);

  return NextResponse.json({ liked: !existing, likeCount: count ?? 0 });
}
