import { notFound } from "next/navigation";
import { LiveEventPage } from "@/components/live-event-page";
import { resolveEventBySlug } from "@/lib/events-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await resolveEventBySlug(slug);
  return { title: event?.title.en ?? "Match" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await resolveEventBySlug(slug);
  if (!event) notFound();
  if (event.sport === "nba" || event.sport === "soccer" || event.live) {
    return <LiveEventPage slug={slug} initial={event} />;
  }
  const { EventThread } = await import("@/components/event-thread");
  return <EventThread event={event} />;
}
