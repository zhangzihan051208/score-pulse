"use client";

import Link from "next/link";
import { useState } from "react";
import { TeamPicker } from "@/components/team-picker";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import {
  favoritePartitions,
  partitionToPath,
} from "@/lib/favorite-teams";
import type { FavoritePair } from "@/lib/types";

export function MyTeamsPageInner() {
  const { locale, t } = useI18n();
  const { favorites, patchPartition, hydrated } = useFavoriteTeams();
  const [saved, setSaved] = useState(false);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10 text-sm text-muted-foreground">
        {t.auth.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.teams.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.teams.lead}</p>

      <div className="mt-8 space-y-8">
        {favoritePartitions().map(({ key, league }) => {
          const pair = favorites[key] ?? {};
          const leagueSlug = league.sport === "soccer" ? league.slug : undefined;
          const title =
            league.sport === "nba"
              ? t.sports.nba
              : leagueLabel(locale, league.slug);

          return (
            <section key={key} className="rounded-xl border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{title}</h2>
                {pair.primary ? (
                  <Link
                    href={`/my-teams/${partitionToPath(key)}/schedule`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t.teams.viewSchedule}
                  </Link>
                ) : null}
              </div>
              <PartitionEditors
                pair={pair}
                sport={league.sport}
                leagueSlug={leagueSlug}
                onChange={async (next) => {
                  await patchPartition(key, next);
                  setSaved(true);
                }}
              />
            </section>
          );
        })}
      </div>

      {saved ? (
        <p className="mt-6 text-sm text-primary">{t.teams.saved}</p>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">{t.teams.localHint}</p>
    </div>
  );
}

function PartitionEditors({
  pair,
  sport,
  leagueSlug,
  onChange,
}: {
  pair: FavoritePair;
  sport: "nba" | "soccer";
  leagueSlug?: string;
  onChange: (pair: FavoritePair | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TeamPicker
        label={t.teams.primary}
        value={pair.primary}
        sport={sport}
        leagueSlug={leagueSlug}
        onSelect={(team) => onChange({ ...pair, primary: team })}
        onClear={() => {
          const next = { ...pair };
          delete next.primary;
          onChange(next.primary || next.secondary ? next : null);
        }}
      />
      <TeamPicker
        label={t.teams.secondary}
        value={pair.secondary}
        sport={sport}
        leagueSlug={leagueSlug}
        onSelect={(team) => onChange({ ...pair, secondary: team })}
        onClear={() => {
          const next = { ...pair };
          delete next.secondary;
          onChange(next.primary || next.secondary ? next : null);
        }}
      />
    </div>
  );
}
