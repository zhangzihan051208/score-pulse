import { handleStripeEvent } from "@/lib/vip-billing";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? "";
  const raw = await request.text();
  try {
    const result = await handleStripeEvent(raw, signature);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "webhook_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
