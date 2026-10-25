import { grantVipUntil, vipUntilFromCheckoutSession } from "@/lib/vip-billing";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { user } = await requestUser(request);
  if (!user) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) return NextResponse.json({ error: "missing_session" }, { status: 400 });
  try {
    const paid = await vipUntilFromCheckoutSession(sessionId, user.id);
    if (paid.error || !paid.until) {
      const status = paid.error === "stripe_not_configured" ? 503 : 402;
      return NextResponse.json({ error: paid.error ?? "unpaid" }, { status });
    }
    const saved = await grantVipUntil(user.id, paid.until);
    if (saved) return NextResponse.json({ error: saved }, { status: 500 });
    return NextResponse.json({ ok: true, vipUntil: paid.until });
  } catch (err) {
    const message = err instanceof Error ? err.message : "confirm_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
