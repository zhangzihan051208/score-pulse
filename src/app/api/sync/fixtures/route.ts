import { syncFixturesFast } from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

function authorizeSync(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeSync(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFixturesFast();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ synced: result.count, skipped: result.skipped ?? false });
}

export async function GET(request: Request) {
  if (!authorizeSync(request)) {
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
