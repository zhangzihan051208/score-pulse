import { syncFixturesFast } from "@/lib/fixtures-sync";
import { authorizeSyncJob } from "@/lib/sync-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFixturesFast();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ synced: result.count, skipped: result.skipped ?? false });
}

export async function GET(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force =
    new URL(request.url).searchParams.get("force") === "1" ||
    new URL(request.url).searchParams.get("sync") === "1";
  const result = await syncFixturesFast(force);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ synced: result.count, skipped: result.skipped ?? false });
}
