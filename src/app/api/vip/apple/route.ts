import { appleVipUntil, grantVipUntil } from "@/lib/vip-billing";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { user } = await requestUser(request);
  if (!user) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { jws?: string };
  const jws = body.jws?.trim();
  if (!jws) return NextResponse.json({ error: "missing_receipt" }, { status: 400 });
  try {
    const verified = await appleVipUntil(jws);
    if (verified.appAccountToken && verified.appAccountToken !== user.id) {
      return NextResponse.json({ error: "wrong_account" }, { status: 403 });
    }
    const saved = await grantVipUntil(user.id, verified.until);
    if (saved) return NextResponse.json({ error: saved }, { status: 500 });
    return NextResponse.json({ ok: true, vipUntil: verified.until });
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_receipt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
