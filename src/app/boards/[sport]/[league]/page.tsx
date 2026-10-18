import { notFound } from "next/navigation";
import { BoardPage } from "@/components/board-page";
import { getLeagueBySlug, leaguesForSport } from "@/lib/leagues";
import { SPORTS, type Sport } from "@/lib/types";

export function generateStaticParams() {
  const params: { sport: string; league: string }[] = [];
  for (const sport of ["nba", "soccer"] as const) {
    for (const league of leaguesForSport(sport)) {
      params.push({ sport, league: league.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; league: string }>;
}) {
  const { sport, league } = await params;
  const cfg = getLeagueBySlug(league);
  return { title: cfg ? `${cfg.label} · ${sport}` : league };
}

export default async function LeagueBoard({
  params,
}: {
  params: Promise<{ sport: string; league: string }>;
}) {
  const { sport, league } = await params;
  if (!SPORTS.includes(sport as Sport)) notFound();
  const cfg = getLeagueBySlug(league);
  if (!cfg || cfg.sport !== sport) notFound();
  return <BoardPage sport={sport as Sport} leagueSlug={league} />;
}
