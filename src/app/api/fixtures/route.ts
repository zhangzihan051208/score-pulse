import { listFixtures } from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const sports =
    sport === "nba"
      ? ["nba"]
      : sport === "soccer"
        ? ["soccer"]
        : ["nba", "soccer"];

  let fixtures = await listFixtures(sports, 16);
  if (fixtures.length === 0) {
    await fetch(new URL("/api/sync/fixtures", request.url), { method: "GET" }).catch(
      () => null,
    );
    fixtures = await listFixtures(sports, 16);
  }

  return NextResponse.json({ fixtures });
}
