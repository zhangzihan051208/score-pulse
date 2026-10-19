"use client";

import { useEffect, useState } from "react";
import { LoadingView } from "@/components/loading-view";
import { Input } from "@/components/ui/input";
import { leagueLabel } from "@/i18n/league-labels";
import { useI18n } from "@/i18n/use-i18n";
import type { FavoriteTeam } from "@/lib/types";

export function TeamPicker({
  label,
  value,
  sport,
  leagueSlug,
  onSelect,
  onClear,
}: {
  label: string;
  value?: FavoriteTeam;
  sport: "nba" | "soccer";
  leagueSlug?: string;
  onSelect: (team: FavoriteTeam) => void;
  onClear: () => void;
}) {
  const { locale, t } = useI18n();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hits, setHits] = useState<
    { id: string; name: string; league?: string; leagueSlug?: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 260);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (debounced.length < 2) {
      setHits([]);
      setFetching(false);
      return;
    }
    const params = new URLSearchParams({ q: debounced, sport });
    if (leagueSlug) params.set("league", leagueSlug);
    let cancelled = false;
    setFetching(true);
    fetch(`/api/teams/search?${params}`)
      .then((r) => r.json())
      .then(
        (d: {
          teams?: { id: string; name: string; league?: string; leagueSlug?: string }[];
        }) => {
          if (!cancelled) setHits(d.teams ?? []);
        },
      )
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, leagueSlug, sport]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {value ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            {t.teams.clear}
          </button>
        ) : null}
      </div>
      {value ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
          {value.name}
        </p>
      ) : (
        <div className="relative">
          <Input
            value={q}
            placeholder={t.teams.searchPlaceholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
          />
          {open && fetching && debounced.length >= 2 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover px-3 py-3 shadow-md">
              <LoadingView message="teamSearch" variant="inline" />
            </div>
          )}
          {open && !fetching && hits.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-md">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      onSelect({ id: hit.id, name: hit.name });
                      setQ("");
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{hit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {hit.league ??
                        (hit.leagueSlug
                          ? leagueLabel(locale, hit.leagueSlug)
                          : t.sports[sport])}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
