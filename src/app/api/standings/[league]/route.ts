import { getLeagueBySlug } from "@/lib/leagues";
import { getLeagueTable } from "@/lib/league-table";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ league: string }> },
) {
  const { league } = await context.params;
  const cfg = getLeagueBySlug(league);
  if (!cfg || (cfg.sport !== "nba" && cfg.sport !== "soccer")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const table = await getLeagueTable(cfg.slug);
  return NextResponse.json(table, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
