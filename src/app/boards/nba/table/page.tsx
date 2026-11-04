import { connection } from "next/server";
import { StandingsScreen } from "@/components/standings-screen";
import { getLeagueBySlug } from "@/lib/leagues";
import { getLeagueTable } from "@/lib/league-table";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export const metadata = { title: "NBA table" };

export default async function NbaTablePage() {
  const cfg = getLeagueBySlug("nba");
  if (!cfg) notFound();
  await connection();
  const table = await getLeagueTable(cfg.slug);
  return <StandingsScreen league={cfg} table={table} />;
}
