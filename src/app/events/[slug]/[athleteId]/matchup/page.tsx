import { notFound } from "next/navigation";
import { LivePlayerMatchup } from "@/components/live-player-matchup";
import { resolveEventBySlug } from "@/lib/events-catalog";
import { resolveAthlete } from "@/lib/event-resolve";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; athleteId: string }>;
}) {
  const { slug, athleteId } = await params;
  const event = await resolveEventBySlug(slug);
  const athlete = event ? resolveAthlete(event, athleteId) : undefined;
  return { title: athlete ? `${athlete.name} · Matchup` : "Matchup" };
}

export default async function PlayerMatchupPage({
  params,
}: {
  params: Promise<{ slug: string; athleteId: string }>;
}) {
  const { slug, athleteId } = await params;
  const event = await resolveEventBySlug(slug);
  const performance = event?.performances.find((p) => p.athleteId === athleteId);
  const athlete = event ? resolveAthlete(event, athleteId) : undefined;
  if (!event || !athlete || !performance) notFound();

  if (event.live) {
    return (
      <LivePlayerMatchup
        slug={slug}
        athleteId={athleteId}
        initialEvent={event}
        initialAthlete={athlete}
        initialPerformance={performance}
      />
    );
  }

  const { PlayerMatchupView } = await import("@/components/player-matchup-view");
  return (
    <PlayerMatchupView event={event} athlete={athlete} performance={performance} />
  );
}
