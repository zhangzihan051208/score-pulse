import { isSafetyAdmin } from "@/lib/safety-server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: "Supabase not configured" }, { status: 503 }) };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  if (!isSafetyAdmin(user.email)) {
    return {
      error: NextResponse.json(
        { error: "Set SAFETY_ADMIN_EMAILS to your login email." },
        { status: 403 },
      ),
    };
  }
  const admin = createServiceClient();
  if (!admin) {
    return {
      error: NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 }),
    };
  }
  return { admin };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;
  const { data, error } = await gate.admin!
    .from("reports")
    .select("id, reporter_id, target_user_id, comment_id, event_id, excerpt, reason, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;
  const body = (await request.json()) as { id?: string; action?: "hide" | "dismiss" };
  if (!body.id || (body.action !== "hide" && body.action !== "dismiss")) {
    return NextResponse.json({ error: "Missing report" }, { status: 400 });
  }
  const admin = gate.admin!;
  const { data: report, error: readError } = await admin
    .from("reports")
    .select("id, comment_id")
    .eq("id", body.id)
    .maybeSingle();
  if (readError || !report) {
    return NextResponse.json({ error: readError?.message ?? "Report not found" }, { status: 404 });
  }
  if (body.action === "hide" && report.comment_id) {
    const { error } = await admin.from("comments").update({ hidden: true }).eq("id", report.comment_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { error } = await admin
    .from("reports")
    .update({ status: body.action === "hide" ? "hidden" : "dismissed" })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
