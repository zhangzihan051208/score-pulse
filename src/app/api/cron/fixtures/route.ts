import { syncFixturesFast } from "@/lib/fixtures-sync";
import { authorizeSyncJob } from "@/lib/sync-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Scheduled job: latest soccer + NBA fixtures into Supabase (use with Vercel Cron or curl). */
export async function GET(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncFixturesFast(true);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    synced: result.count,
    skipped: result.skipped ?? false,
    at: new Date().toISOString(),
  });
}
