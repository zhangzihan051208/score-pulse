"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [source, setSource] = useState<"kashrock" | "pandascore" | null>(null);
  const [loading, setLoading] = useState(
    enabled && initialEvents.length === 0,
  );
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const load = useCallback(async () => {
    if (!enabled) return;
    const params = new URLSearchParams({ limit: "32", live: "1" });
    if (gameSlug) params.set("game", gameSlug);
    try {
      const res = await fetch(`/api/esports/events?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        events?: MatchEvent[];
        source?: "kashrock" | "pandascore" | null;
      };
      setEvents(data.events ?? []);
      setSource(data.source ?? null);
    } finally {
      setLoading(false);
    }
  }, [enabled, gameSlug]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const hasLive = events.some((e) => e.status === "live");
  const pollMs =
    enabled && hasLive && tabVisible ? 30_000 : null;

  useIntervalWhen(
    () => load(),
    pollMs,
    { deferFirstMs: 0 },
  );

  return { events, loading, source, refresh: load };
}
