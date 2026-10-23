"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIntervalWhen } from "@/hooks/use-interval-when";
import { useTabVisible } from "@/hooks/use-tab-visible";
import { alignEventsToNow } from "@/lib/match-clock";
import { POLL, listPollIntervalMs } from "@/lib/poll-policy";
import type { EsportsGameSlug } from "@/lib/esports-games";
import type { MatchEvent } from "@/lib/types";

export function useEsportsEvents(
  gameSlug?: EsportsGameSlug,
  enabled = true,
  initialEvents: MatchEvent[] = [],
) {
  const tabVisible = useTabVisible();
  const [now, setNow] = useState(() => Date.now());
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const aligned = useMemo(() => alignEventsToNow(events, now), [events, now]);
  const pollMs = enabled ? listPollIntervalMs(aligned, tabVisible, now) : null;

  useIntervalWhen(
    () => load(),
    pollMs,
    { deferFirstMs: initialEvents.length > 0 ? POLL.seedGraceMs : 0 },
  );

  return { events: aligned, loading, source, refresh: load };
}
