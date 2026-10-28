import { enrichFixturesBatch } from "@/lib/fixtures-sync";
import { authorizeSyncJob } from "@/lib/sync-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Scheduled job: fill missing lineups without blocking live score sync. */
export async function GET(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await enrichFixturesBatch(true);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    enriched: result.enriched,
    candidates: result.candidates,
    skipped: result.skipped ?? false,
    at: new Date().toISOString(),
  });
}
