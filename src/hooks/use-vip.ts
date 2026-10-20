"use client";

import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { VipQuota } from "@/lib/types";
import { FREE_FULL_RATINGS_PER_DAY } from "@/lib/vip";
import { useCallback, useEffect, useState } from "react";

const offlineQuota: VipQuota = {
  isVip: false,
  vipUntil: null,
  fullRatingsToday: 0,
  fullRatingsLimit: FREE_FULL_RATINGS_PER_DAY,
  fullRatingsRemaining: FREE_FULL_RATINGS_PER_DAY,
  canFullDimensions: true,
};

export function useVipQuota() {
  const { user, enabled } = useAuth();
  const cloud = enabled && isSupabaseConfigured();
  const [quota, setQuota] = useState<VipQuota>(offlineQuota);
  const [loading, setLoading] = useState(cloud);

  const reload = useCallback(async () => {
    if (!cloud || !user) {
      setQuota(offlineQuota);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vip/status");
      if (res.ok) {
        const data = (await res.json()) as { quota: VipQuota };
        setQuota(data.quota);
      }
    } finally {
      setLoading(false);
    }
  }, [cloud, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { quota, loading, cloud, reload };
}
