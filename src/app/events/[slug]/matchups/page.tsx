import { notFound } from "next/navigation";
import { LiveEventMatchupsPage } from "@/components/live-event-matchups-page";
import { resolveEventBySlug } from "@/lib/events-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await resolveEventBySlug(slug);
  return { title: event ? `${event.title.en} · Matchups` : "Matchups" };
}

export default async function EventMatchupsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await resolveEventBySlug(slug);
  if (!event) notFound();

  if (event.live) {
    return <LiveEventMatchupsPage slug={slug} initial={event} />;
  }

  const { EventMatchupsThread } = await import("@/components/event-matchups-thread");
  return <EventMatchupsThread event={event} />;
}
