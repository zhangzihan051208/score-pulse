import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { refreshItemHeat } from "@/lib/zone-server";
import { NextResponse } from "next/server";

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

  const body = (await request.json()) as { action?: "approve" | "reject" };
  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: comment } = await supabase
    .from("comments")
    .select("id, zone_id, zone_item_id, user_id, moderation_status")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment?.zone_id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const { data: zone } = await supabase
    .from("rating_zones")
    .select("owner_id")
    .eq("id", comment.zone_id)
    .maybeSingle();

  if (zone?.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const moderation_status = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("comments")
    .update({ moderation_status, hidden: action === "reject" })
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (
    action === "approve" &&
    comment.zone_item_id &&
    comment.moderation_status !== "approved"
  ) {
    await refreshItemHeat(supabase, comment.zone_item_id, comment.zone_id);
  }

  return NextResponse.json({ ok: true, moderation_status });
}
