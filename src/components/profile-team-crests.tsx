"use client";

import { useEffect, useState } from "react";
import { crestTeamsFromFavorites } from "@/lib/profile-teams";
import type { FavoriteTeamsMap } from "@/lib/types";

type CrestView = {
  key: string;
  name: string;
  badgeUrl?: string;
};

export function ProfileTeamCrests({ favorites }: { favorites: FavoriteTeamsMap }) {
  const teams = crestTeamsFromFavorites(favorites);
  const [crests, setCrests] = useState<CrestView[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: CrestView[] = [];
      for (const row of teams) {
        const key = `${row.partition}-${row.role}`;
        if (row.team.badgeUrl) {
          out.push({ key, name: row.team.name, badgeUrl: row.team.badgeUrl });
          continue;
        }
        try {
          const params = new URLSearchParams({
            sport: row.sport,
            name: row.team.name,
          });
          const res = await fetch(
            `/api/teams/${encodeURIComponent(row.team.id)}?${params}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { team?: { badgeUrl?: string } };
            out.push({
              key,
              name: row.team.name,
              badgeUrl: data.team?.badgeUrl,
            });
          } else {
            out.push({ key, name: row.team.name });
          }
        } catch {
          out.push({ key, name: row.team.name });
        }
      }
      if (!cancelled) setCrests(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (teams.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {crests.map((c) => (
        <div
          key={c.key}
          className="flex flex-col items-center gap-1 rounded-lg border bg-muted/30 px-3 py-2"
          title={c.name}
        >
          {c.badgeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.badgeUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="max-w-[5rem] truncate text-[10px] text-muted-foreground">
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}
