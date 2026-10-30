import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BoardPage } from "@/components/board-page";
import { getEsportsGame, isEsportsGameSlug } from "@/lib/esports-games";
import { cachedEsportsMatchEvents } from "@/lib/esports-data-cache";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { getLeagueBySlug, leaguesForSport } from "@/lib/leagues";
import { SPORTS, type Sport } from "@/lib/types";

export const revalidate = 30;

export function generateStaticParams() {
  const params: { sport: string; league: string }[] = [];
  for (const sport of ["nba", "soccer", "esports"] as const) {
    for (const league of leaguesForSport(sport)) {
      if (sport === "nba" && league.slug !== "nba") continue;
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
  if (sport === "esports" && isEsportsGameSlug(league)) {
    const g = getEsportsGame(league);
    return { title: g ? `${g.label} · Esports` : league };
  }
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
  const s = sport as Sport;
  if (s === "esports") {
    if (!isEsportsGameSlug(league)) notFound();
  } else {
    const cfg = getLeagueBySlug(league);
    if (!cfg || cfg.sport !== sport) notFound();
  }
  let initialEvents: Awaited<ReturnType<typeof cachedLiveMatchEvents>> = [];
  if (s === "nba" || s === "soccer") {
    await connection();
    initialEvents = await cachedLiveMatchEvents([s], 32, league);
  } else if (s === "esports" && isEsportsGameSlug(league)) {
    await connection();
    initialEvents = await cachedEsportsMatchEvents(league, 28);
  }
  return <BoardPage sport={s} leagueSlug={league} initialEvents={initialEvents} />;
}
