import Link from "next/link";
import { MapPin, MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  STATUS_LABEL,
  SPORT_LABEL,
  athletes,
  formatWhen,
  seedComments,
} from "@/lib/data";
import type { MatchEvent } from "@/lib/types";

export function EventCard({ event }: { event: MatchEvent }) {
  const commentCount = seedComments.filter((c) => c.eventId === event.id).length;
  const raterCount = event.performances.reduce((n, p) => n + p.ratingCount, 0);

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      <Card className="h-full transition hover:-translate-y-0.5 hover:ring-primary/30">
        <div className={`h-28 bg-gradient-to-br ${event.cover} px-4 py-3 text-white`}>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="border-0 bg-white/20 text-white"
            >
              {SPORT_LABEL[event.sport]}
            </Badge>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                event.status === "live"
                  ? "bg-red-500 text-white"
                  : event.status === "upcoming"
                    ? "bg-black/30 text-white"
                    : "bg-white/20 text-white"
              }`}
            >
              {event.status === "live" && (
                <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-white" />
              )}
              {STATUS_LABEL[event.status]}
            </span>
          </div>
          <p className="mt-6 text-sm text-white/80">{formatWhen(event.startAt)}</p>
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{event.title}</CardTitle>
          <CardDescription>{event.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-muted-foreground">{event.summary}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {event.venue}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {event.performances.slice(0, 3).map((p) => (
              <span
                key={p.athleteId}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {athletes[p.athleteId]?.name}
              </span>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {raterCount.toLocaleString("zh-CN")} 人次评分
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {commentCount} 条示范评论
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
