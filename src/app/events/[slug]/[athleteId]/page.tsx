import { notFound } from "next/navigation";
import { LiveRatePage } from "@/components/live-rate-page";
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
  return { title: athlete?.name ?? "Rate" };
}

export default async function RatePage({
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
      <LiveRatePage
        slug={slug}
        athleteId={athleteId}
        initialEvent={event}
        initialAthlete={athlete}
        initialPerformance={performance}
      />
    );
  }

  const { RateCard } = await import("@/components/rate-card");
  return (
    <RateCard event={event} athlete={athlete} performance={performance} />
  );
}
