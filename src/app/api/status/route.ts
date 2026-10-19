import { getDegradedMode } from "@/lib/service-degraded";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { degraded: getDegradedMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
