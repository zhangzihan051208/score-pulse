import { notFound } from "next/navigation";
import { EventThread } from "@/components/event-thread";
import { events } from "@/lib/data";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);
  return { title: event?.title.en ?? "Match" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);
  if (!event) notFound();
  return <EventThread event={event} />;
}
