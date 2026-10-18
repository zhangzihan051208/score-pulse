import { notFound } from "next/navigation";
import { RateCard } from "@/components/rate-card";
import { athletes, events } from "@/lib/data";

export function generateStaticParams() {
  return events.flatMap((event) =>
    event.performances.map((p) => ({
      slug: event.slug,
      athleteId: p.athleteId,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; athleteId: string }>;
}) {
  const { slug, athleteId } = await params;
  const event = events.find((item) => item.slug === slug);
  const athlete = athletes[athleteId];
  return {
    title: event && athlete ? `${athlete.name}` : "Rate",
  };
}

export default async function RatePage({
  params,
}: {
  params: Promise<{ slug: string; athleteId: string }>;
}) {
  const { slug, athleteId } = await params;
  const event = events.find((item) => item.slug === slug);
  const athlete = athletes[athleteId];
  const performance = event?.performances.find((p) => p.athleteId === athleteId);
  if (!event || !athlete || !performance) notFound();
  return (
    <RateCard event={event} athlete={athlete} performance={performance} />
  );
}
