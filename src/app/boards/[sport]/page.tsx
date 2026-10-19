import { notFound } from "next/navigation";
import { BoardPage } from "@/components/board-page";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";
import { SPORTS, type Sport } from "@/lib/types";

export const revalidate = 30;

export function generateStaticParams() {
  return SPORTS.map((sport) => ({ sport }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  return { title: sport.toUpperCase() };
}

export default async function SportBoard({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!SPORTS.includes(sport as Sport)) notFound();
  const s = sport as Sport;
  const initialEvents =
    s === "nba" || s === "soccer"
      ? await cachedLiveMatchEvents([s], 32)
      : [];
  return <BoardPage sport={s} initialEvents={initialEvents} />;
}
