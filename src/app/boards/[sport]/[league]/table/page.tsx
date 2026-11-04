import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StandingsScreen } from "@/components/standings-screen";
import { PausedSection } from "@/components/paused-section";
import { isSportOpen } from "@/lib/features";
import { getLeagueBySlug } from "@/lib/leagues";
import { getLeagueTable } from "@/lib/league-table";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; league: string }>;
}) {
  const { league } = await params;
  const cfg = getLeagueBySlug(league);
  return { title: cfg ? `${cfg.label} table` : "Table" };
}

export default async function LeagueTablePage({
  params,
}: {
  params: Promise<{ sport: string; league: string }>;
}) {
  const { sport, league } = await params;
  if (!isSportOpen(sport)) return <PausedSection />;
  const cfg = getLeagueBySlug(league);
  if (!cfg || cfg.sport !== sport) notFound();
  if (cfg.sport !== "nba" && cfg.sport !== "soccer") notFound();
  await connection();
  const table = await getLeagueTable(cfg.slug);
  return <StandingsScreen league={cfg} table={table} />;
}
