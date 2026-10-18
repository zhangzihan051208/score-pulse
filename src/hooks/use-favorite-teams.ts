"use client";

import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import {
  emptyFavorites,
  FAVORITE_TEAMS_STORAGE_KEY,
  normalizeFavorites,
} from "@/lib/favorite-teams";
import type { FavoriteTeamsMap } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

function readLocal(): FavoriteTeamsMap {
  if (typeof window === "undefined") return emptyFavorites();
  try {
    const raw = localStorage.getItem(FAVORITE_TEAMS_STORAGE_KEY);
    if (!raw) return emptyFavorites();
    return normalizeFavorites(JSON.parse(raw));
  } catch {
    return emptyFavorites();
  }
}

function writeLocal(map: FavoriteTeamsMap) {
  localStorage.setItem(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(map));
}

export function useFavoriteTeams() {
  const { user } = useAuth();
  const { profile, cloud, save: saveProfile } = useProfile();
  const [local, setLocal] = useState<FavoriteTeamsMap>(emptyFavorites);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocal(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !profile?.favoriteTeams) return;
    if (user && cloud) {
      setLocal(profile.favoriteTeams);
      writeLocal(profile.favoriteTeams);
    }
  }, [cloud, hydrated, profile?.favoriteTeams, user]);

  const favorites = local;

  const save = useCallback(
    async (next: FavoriteTeamsMap) => {
      const normalized = normalizeFavorites(next);
      setLocal(normalized);
      writeLocal(normalized);
      if (user && cloud) {
        await saveProfile({ favoriteTeams: normalized });
      }
      return { ok: true as const };
    },
    [cloud, saveProfile, user],
  );

  const patchPartition = useCallback(
    async (
      partition: string,
      pair: FavoriteTeamsMap[string] | null,
    ) => {
      const next = { ...favorites };
      if (!pair || (!pair.primary && !pair.secondary)) {
        delete next[partition];
      } else {
        next[partition] = pair;
      }
      return save(next);
    },
    [favorites, save],
  );

  return { favorites, hydrated, save, patchPartition };
}
