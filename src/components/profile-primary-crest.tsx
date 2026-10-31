"use client";

import { useEffect, useState } from "react";
import { TeamCrest } from "@/components/team-crest";
import { primaryCrestFromFavorites } from "@/lib/profile-teams";
import type { FavoriteTeamsMap } from "@/lib/types";
import { cn } from "cn";

export function ProfilePrimaryCrest({
  favorites,
  className,
  size = "md",
}: {
  favorites: FavoriteTeamsMap;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const primary = primaryCrestFromFavorites(favorites);
  const [badgeUrl, setBadgeUrl] = useState<string | undefined>(
    primary?.team.badgeUrl,
  );

  useEffect(() => {
    if (!primary) {
      setBadgeUrl(undefined);
      return;
    }
    if (primary.team.badgeUrl) {
      setBadgeUrl(primary.team.badgeUrl);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          sport: primary.sport,
          name: primary.team.name,
        });
        const res = await fetch(
          `/api/teams/${encodeURIComponent(primary.team.id)}?${params}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { team?: { badgeUrl?: string } };
        if (!cancelled) setBadgeUrl(data.team?.badgeUrl);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (!primary) return null;

  return (
    <TeamCrest
      name={primary.team.name}
      badgeUrl={badgeUrl}
      size={size}
      className={cn("ring-2 ring-background", className)}
    />
  );
}
