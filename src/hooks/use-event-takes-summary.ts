"use client";

import { useCallback, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { useLivePoll } from "@/hooks/use-live-poll";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SummaryTake = CommunityTake;

export function useEventTakesSummary(eventId: string) {
  const [byAthlete, setByAthlete] = useState<Record<string, SummaryTake[]>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    const res = await fetch(
      `/api/community/${encodeURIComponent(eventId)}/summary`,
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
  }, [eventId]);

  useLivePoll(load, isSupabaseConfigured());

  return { byAthlete, loaded, reload: load };
}
