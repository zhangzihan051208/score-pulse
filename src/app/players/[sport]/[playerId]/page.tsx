import { PlayerHubPageInner } from "@/components/player-hub-page";
import { SPORTS, type Sport } from "@/lib/types";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; playerId: string }>;
}) {
  const { playerId } = await params;
  return { title: decodeURIComponent(playerId) };
}

export default async function PlayerHubPage({
  params,
}: {
  params: Promise<{ sport: string; playerId: string }>;
}) {
  const { sport: sportRaw, playerId } = await params;
  if (!(SPORTS as readonly string[]).includes(sportRaw)) notFound();
  const sport = sportRaw as Sport;
  const id = decodeURIComponent(playerId);

  return <PlayerHubPageInner sport={sport} playerId={id} />;
}
