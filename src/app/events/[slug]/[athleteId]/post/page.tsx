import { notFound } from "next/navigation";
import { LivePlayerPost } from "@/components/live-player-post";
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
  return { title: athlete ? `${athlete.name} · Post` : "Post rating" };
}

export default async function PlayerPostPage({
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
      <LivePlayerPost
        slug={slug}
        athleteId={athleteId}
        initialEvent={event}
        initialAthlete={athlete}
        initialPerformance={performance}
      />
    );
  }

  const { PlayerPostCard } = await import("@/components/player-post-card");
  return (
    <PlayerPostCard event={event} athlete={athlete} performance={performance} />
  );
}
