import { notFound } from "next/navigation";
import { PerformanceStudio } from "@/components/performance-studio";
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
    title: event && athlete ? `${athlete.name} · ${event.title}` : "表现评分",
  };
}

export default async function PerformancePage({
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PerformanceStudio
        event={event}
        athlete={athlete}
        performance={performance}
      />
    </div>
  );
}
