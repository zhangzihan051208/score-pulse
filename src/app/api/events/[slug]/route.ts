import {
  getLiveMatchBySlug,
  syncSportsDbFixtures,
} from "@/lib/fixtures-sync";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("sync") === "1") {
    await syncSportsDbFixtures(true);
  } else {
    await syncSportsDbFixtures(false);
  }

  let event = await getLiveMatchBySlug(slug);
  if (!event && /^\d+$/.test(slug)) {
    const { getLiveMatchById } = await import("@/lib/fixtures-sync");
    event = await getLiveMatchById(slug);
  }
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ event, syncedAt: new Date().toISOString() });
}
