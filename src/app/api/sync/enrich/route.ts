import { enrichFixturesBatch } from "@/lib/fixtures-sync";
import { authorizeSyncJob } from "@/lib/sync-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await enrichFixturesBatch(force);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  if (!authorizeSyncJob(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await enrichFixturesBatch(force);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
