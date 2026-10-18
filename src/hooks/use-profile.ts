"use client";

import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserProfile } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export function useProfile() {
  const { user, enabled: authEnabled } = useAuth();
  const cloud = authEnabled && isSupabaseConfigured();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(cloud);

  const reload = useCallback(async () => {
    if (!cloud || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = (await res.json()) as { profile: UserProfile };
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [cloud, user]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function save(patch: {
    displayName?: string;
    avatarUrl?: string | null;
    bio?: string | null;
  }) {
    if (!cloud || !user) return { ok: false as const, error: "Not signed in" };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as { profile?: UserProfile; error?: string };
    if (!res.ok) {
      return { ok: false as const, error: data.error ?? "Save failed" };
    }
    if (data.profile) setProfile(data.profile);
    return { ok: true as const, profile: data.profile! };
  }

  return { profile, loading, cloud, reload, save };
}
