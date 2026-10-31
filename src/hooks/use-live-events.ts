"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIntervalWhen } from "@/hooks/use-interval-when";
import { useTabVisible } from "@/hooks/use-tab-visible";
import { alignEventToNow, alignEventsToNow, kickoffIsSoon } from "@/lib/match-clock";
import { POLL, detailPollIntervalMs, listPollIntervalMs } from "@/lib/poll-policy";
import type { MatchEvent } from "@/lib/types";

function useWallClock(ms = 5_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function useLiveEvents(
  sport?: "nba" | "soccer",
  enabled = true,
  leagueSlug?: string,
  initialEvents?: MatchEvent[],
) {
  const tabVisible = useTabVisible();
  const now = useWallClock();
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents ?? []);
  const [loading, setLoading] = useState(
    enabled && !(initialEvents && initialEvents.length > 0),
  );
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const hasSeed = Boolean(initialEvents && initialEvents.length > 0);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const load = useCallback(
    async (refresh: boolean) => {
      if (!enabled) return;
      const params = new URLSearchParams();
      if (sport) params.set("sport", sport);
      if (leagueSlug) params.set("league", leagueSlug);
      params.set("limit", sport ? "32" : "48");
      const hasLive = eventsRef.current.some(
        (e) => e.status === "live" || kickoffIsSoon(e.startAt),
      );
      if (refresh) params.set("sync", "1");
      else if (hasLive) params.set("live", "1");
      try {
        const res = await fetch(`/api/events?${params}`, {
          signal: AbortSignal.timeout(12_000),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          events?: MatchEvent[];
          syncedAt?: string;
        };
        setEvents((prev) => {
          const next = data.events ?? [];
          if (next.length === 0 && prev.length > 0) return prev;
          return next;
        });
        setSyncedAt(data.syncedAt ?? null);
      } catch {
        /* keep the rows already on screen */
      } finally {
        setLoading(false);
      }
    },
    [enabled, leagueSlug, sport],
  );

  const aligned = useMemo(() => alignEventsToNow(events, now), [events, now]);
  const pollMs = enabled ? listPollIntervalMs(aligned, tabVisible, now) : null;

  useIntervalWhen(
    () => load(false),
    pollMs,
    { deferFirstMs: hasSeed ? POLL.seedGraceMs : 0 },
  );

  return { events: aligned, loading, syncedAt, refresh: () => load(true) };
}

export function useLiveEvent(slug: string, seed?: MatchEvent | null) {
  const tabVisible = useTabVisible();
  const now = useWallClock();
  const [event, setEvent] = useState<MatchEvent | null>(seed ?? null);
  const [loading, setLoading] = useState(!seed);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const currentRef = useRef<MatchEvent | null>(seed ?? null);
  currentRef.current = event ?? seed ?? null;

  const load = useCallback(
    async (sync: boolean) => {
      const current = currentRef.current;
      const due =
        sync ||
        current?.status === "live" ||
        (current ? kickoffIsSoon(current.startAt) : false);
      const liveQ = due ? (sync ? "?sync=1" : "?live=1") : "";
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(slug)}${liveQ}`, {
          signal: AbortSignal.timeout(12_000),
        });
        if (res.status === 404) {
          setEvent(null);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as {
          event?: MatchEvent;
          syncedAt?: string;
        };
        setEvent(data.event ?? null);
        setSyncedAt(data.syncedAt ?? null);
      } catch {
        /* keep the match already on screen */
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const current = useMemo(() => {
    const raw = event ?? seed ?? null;
    return raw ? alignEventToNow(raw, now) : null;
  }, [event, now, seed]);
  const pollMs = detailPollIntervalMs(current, tabVisible, now);

  useIntervalWhen(
    () => load(false),
    pollMs,
    { deferFirstMs: seed ? POLL.seedGraceMs : 0 },
  );

  useEffect(() => {
    const s = seed ?? null;
    if (s?.status === "live" && s.performances.length === 0) {
      void load(true);
    }
  }, [load, seed, slug]);

  return { event: current, loading, syncedAt, refresh: () => load(true) };
}
