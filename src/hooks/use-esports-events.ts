"use client";

import { useCallback, useRef, useState } from "react";
import { useIntervalWhen } from "@/hooks/use-interval-when";
import { useTabVisible } from "@/hooks/use-tab-visible";
import type { EsportsGameSlug } from "@/lib/esports-games";
import type { MatchEvent } from "@/lib/types";

export function useEsportsEvents(
  gameSlug?: EsportsGameSlug,
  enabled = true,
  initialEvents: MatchEvent[] = [],
) {
  const tabVisible = useTabVisible();
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);
  const [loading, setLoading] = useState(
    enabled && !(initialEvents && initialEvents.length > 0),
  );
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const load = useCallback(async () => {
    if (!enabled) return;
    const params = new URLSearchParams({ limit: "32" });
    if (gameSlug) params.set("game", gameSlug);
    const hasLive = eventsRef.current.some((e) => e.status === "live");
    if (hasLive) params.set("live", "1");
    const res = await fetch(`/api/esports/events?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as { events?: MatchEvent[] };
    setEvents(data.events ?? []);
    setLoading(false);
  }, [enabled, gameSlug]);

  const hasLive = events.some((e) => e.status === "live");
  const pollMs =
    enabled && hasLive && tabVisible ? 30_000 : enabled && tabVisible ? null : null;

  useIntervalWhen(
    () => load(),
    pollMs,
    { deferFirstMs: initialEvents.length > 0 ? 25_000 : 0 },
  );

  return { events, loading, refresh: load };
}
