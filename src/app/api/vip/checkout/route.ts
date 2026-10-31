import { createMonthlyCheckout } from "@/lib/vip-billing";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { VIP_BILLING_ENABLED } from "@/lib/vip";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!VIP_BILLING_ENABLED) {
    return NextResponse.json({ error: "vip_disabled" }, { status: 503 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  const { user } = await requestUser(request);
  if (!user) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  try {
    const result = await createMonthlyCheckout({
      userId: user.id,
      email: user.email ?? "",
      origin,
    });
    if (result.error || !result.url) {
      return NextResponse.json({ error: result.error ?? "checkout_failed" }, { status: 503 });
    }
    return NextResponse.json({ url: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
