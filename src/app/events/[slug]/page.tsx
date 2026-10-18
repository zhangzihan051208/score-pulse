import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { PerformanceBoard } from "@/components/performance-board";
import { Badge } from "@/components/ui/badge";
import { events, formatWhen, SPORT_LABEL, STATUS_LABEL } from "@/lib/data";

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
  return { title: event?.title ?? "赛事" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);
  if (!event) notFound();

  return (
    <div>
      <section className={`bg-gradient-to-br ${event.cover} text-white`}>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/20 text-white">
              {SPORT_LABEL[event.sport]}
            </Badge>
            <Badge className="border-0 bg-black/25 text-white">
              {STATUS_LABEL[event.status]}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{event.title}</h1>
          <p className="text-lg text-white/85">{event.subtitle}</p>
          <p className="max-w-2xl text-white/80">{event.summary}</p>
          <p className="flex items-center gap-2 text-sm text-white/75">
            <MapPin className="size-4" />
            {event.venue} · {formatWhen(event.startAt)}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PerformanceBoard event={event} />
      </div>
    </div>
  );
}
