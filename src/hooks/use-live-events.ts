"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchEvent } from "@/lib/types";

const POLL_MS = 90_000;

export function useLiveEvents(
  sport?: "nba" | "soccer",
  enabled = true,
) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    if (!enabled) return;
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    params.set("limit", "16");
    if (refresh) params.set("sync", "1");
    const res = await fetch(`/api/events?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      events?: MatchEvent[];
      syncedAt?: string;
    };
    setEvents(data.events ?? []);
    setSyncedAt(data.syncedAt ?? null);
    setLoading(false);
  }, [enabled, sport]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      return;
    }
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { events, loading, syncedAt, refresh: () => load(true) };
}

export function useLiveEvent(slug: string) {
  const [event, setEvent] = useState<MatchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const load = useCallback(
    async (sync: boolean) => {
      const q = sync ? "?sync=1" : "";
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
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { event, loading, syncedAt, refresh: () => load(true) };
}
