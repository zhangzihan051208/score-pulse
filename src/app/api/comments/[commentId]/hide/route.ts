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

  const { data: row } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { error } = await supabase
    .from("comments")
    .update({ hidden: true })
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
