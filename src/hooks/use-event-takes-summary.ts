"use client";

import { useCallback, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { useLivePoll } from "@/hooks/use-live-poll";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/types";

type SummaryTake = CommunityTake;

export function useEventTakesSummary(eventId: string, locale: Locale = "en") {
  const [byAthlete, setByAthlete] = useState<Record<string, SummaryTake[]>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    const qs = new URLSearchParams({ locale });
    const res = await fetch(
      `/api/community/${encodeURIComponent(eventId)}/summary?${qs}`,
      { credentials: "same-origin", cache: "no-store" },
    );
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const data = (await res.json()) as {
      takesByAthlete?: Record<string, SummaryTake[]>;
    };
    setByAthlete(data.takesByAthlete ?? {});
    setLoaded(true);
  }, [eventId, locale]);

  useLivePoll(load, isSupabaseConfigured());

  return { byAthlete, loaded, reload: load };
}
