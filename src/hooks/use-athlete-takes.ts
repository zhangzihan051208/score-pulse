"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommunityTake } from "@/components/community-ratings-panel";
import { useAuth } from "@/hooks/use-auth";
import { localTakesForAthlete, topEngagementTake } from "@/lib/event-spotlight";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CommunityState } from "@/lib/store";
import type { Locale, MatchEvent, PositionKey } from "@/lib/types";

export function useAthleteTakes(
  event: MatchEvent,
  athleteId: string,
  positionKey: PositionKey,
  state: CommunityState,
  locale: Locale,
) {
  const { enabled: authEnabled } = useAuth();
  const [remoteTakes, setRemoteTakes] = useState<CommunityTake[]>([]);

  const loadRemote = useCallback(async () => {
    if (!authEnabled || !isSupabaseConfigured()) return;
    const qs = new URLSearchParams({ positionKey });
    const res = await fetch(
      `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(athleteId)}?${qs}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { takes?: CommunityTake[] };
    setRemoteTakes(data.takes ?? []);
  }, [athleteId, authEnabled, event.id, positionKey]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const takes = useMemo(() => {
    const local = localTakesForAthlete(event, athleteId, state, locale);
    if (remoteTakes.length > 0) return remoteTakes;
    return local;
  }, [athleteId, event, locale, remoteTakes, state]);

  const topTake = useMemo(
    () => topEngagementTake(takes, positionKey),
    [positionKey, takes],
  );

  return { takes, topTake, reload: loadRemote };
}
