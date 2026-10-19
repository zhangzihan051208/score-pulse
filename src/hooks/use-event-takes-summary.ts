"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SummaryTake = CommunityTake;

export function useEventTakesSummary(eventId: string) {
  const { enabled: authEnabled } = useAuth();
  const [byAthlete, setByAthlete] = useState<Record<string, SummaryTake[]>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!authEnabled || !isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    const res = await fetch(
      `/api/community/${encodeURIComponent(eventId)}/summary`,
      { credentials: "same-origin" },
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
  }, [authEnabled, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  return { byAthlete, loaded, reload: load };
}
