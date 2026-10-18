"use client";

import { RateCard } from "@/components/rate-card";
import { useLiveEvent } from "@/hooks/use-live-events";
import { resolveAthlete } from "@/lib/event-resolve";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

export function LiveRatePage({
  slug,
  athleteId,
  initialEvent,
  initialAthlete,
  initialPerformance,
}: {
  slug: string;
  athleteId: string;
  initialEvent: MatchEvent;
  initialAthlete: Athlete;
  initialPerformance: Performance;
}) {
  const { event } = useLiveEvent(slug);
  const data = event ?? initialEvent;
  const performance =
    data.performances.find((p) => p.athleteId === athleteId) ?? initialPerformance;
  const athlete = resolveAthlete(data, athleteId) ?? initialAthlete;

  return <RateCard event={data} athlete={athlete} performance={performance} />;
}
