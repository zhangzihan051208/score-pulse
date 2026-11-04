"use client";

import { useEffect, useState } from "react";
import { hasStandings, type LeagueTablePayload } from "@/lib/league-table";

const memory = new Map<string, LeagueTablePayload>();
const inflight = new Map<string, Promise<LeagueTablePayload | null>>();

function load(slug: string) {
  const cached = memory.get(slug);
  if (cached) return Promise.resolve(cached);
  let pending = inflight.get(slug);
  if (!pending) {
    pending = fetch(`/api/standings/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as LeagueTablePayload;
      })
      .then((body) => {
        if (body) memory.set(slug, body);
        inflight.delete(slug);
        return body;
      })
      .catch(() => {
        inflight.delete(slug);
        return null;
      });
    inflight.set(slug, pending);
  }
  return pending;
}

export function useLeagueTable(slug: string | undefined) {
  const enabled = hasStandings(slug);
  const [data, setData] = useState<LeagueTablePayload | null>(
    enabled ? memory.get(slug) ?? null : null,
  );

  useEffect(() => {
    if (!enabled) return;
    const cached = memory.get(slug);
    if (cached) {
      setData(cached);
      return;
    }
    let cancel = false;
    void load(slug).then((body) => {
      if (!cancel) setData(body);
    });
    return () => {
      cancel = true;
    };
  }, [enabled, slug]);

  return enabled ? data : null;
}
