"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchEvent } from "@/lib/types";

const POLL_MS = 45_000;
const POLL_LIVE_MS = 25_000;

export function useLiveEvents(
  sport?: "nba" | "soccer",
  enabled = true,
  leagueSlug?: string,
  initialEvents?: MatchEvent[],
) {
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents ?? []);
  const [loading, setLoading] = useState(enabled && !(initialEvents && initialEvents.length > 0));
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    if (!enabled) return;
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (leagueSlug) params.set("league", leagueSlug);
    params.set("limit", sport ? "32" : "48");
    if (refresh) params.set("sync", "1");
    else params.set("live", "1");
    const res = await fetch(`/api/events?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      events?: MatchEvent[];
      syncedAt?: string;
    };
    setEvents(data.events ?? []);
    setSyncedAt(data.syncedAt ?? null);
    setLoading(false);
  }, [enabled, leagueSlug, sport]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      return;
    }
    load(false);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { events, loading, syncedAt, refresh: () => load(true) };
}

export function useLiveEvent(slug: string, seed?: MatchEvent | null) {
  const [event, setEvent] = useState<MatchEvent | null>(seed ?? null);
  const [loading, setLoading] = useState(!seed);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const load = useCallback(
    async (sync: boolean) => {
      const q = sync ? "?sync=1" : "?live=1";
      const res = await fetch(`/api/events/${encodeURIComponent(slug)}${q}`);
      if (res.status === 404) {
        setEvent(null);
        setLoading(false);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        event?: MatchEvent;
        syncedAt?: string;
      };
      setEvent(data.event ?? null);
      setSyncedAt(data.syncedAt ?? null);
      setLoading(false);
    },
    [slug],
  );

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(false), POLL_LIVE_MS);
    return () => clearInterval(id);
  }, [load]);

  return { event, loading, syncedAt, refresh: () => load(true) };
}
