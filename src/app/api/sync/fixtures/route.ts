import { syncSportsDbFixtures } from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await syncSportsDbFixtures();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ synced: result.count });
}

export async function GET() {
  const result = await syncSportsDbFixtures();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ synced: result.count });
}
