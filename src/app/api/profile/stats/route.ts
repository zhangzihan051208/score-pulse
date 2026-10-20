import { computeUserLevel } from "@/lib/user-level";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

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

  const { data: comments } = await supabase
    .from("comments")
    .select("id")
    .eq("user_id", user.id)
    .eq("hidden", false)
    .is("parent_id", null);

  const ids = (comments ?? []).map((c) => c.id);
  let likesReceived = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .in("comment_id", ids.slice(0, 200));
    likesReceived = count ?? 0;
  }

  const commentCount = ids.length;
  const level = computeUserLevel(commentCount, likesReceived);

  return NextResponse.json({
    engagement: {
      commentCount,
      likesReceived,
      level: level.level,
      levelTitleKey: level.titleKey,
      points: level.points,
      nextLevelAt: level.nextLevelAt,
    },
  });
}
