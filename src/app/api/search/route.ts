import { searchFixtures, syncSportsDbFixtures } from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const sync = searchParams.get("sync") === "1";

  if (sync) {
    await syncSportsDbFixtures(false);
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 40);
  const result = await searchFixtures(q, limit);

  return NextResponse.json(result);
}
