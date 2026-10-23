"use client";

import { TeamPicker } from "@/components/team-picker";
import { useI18n } from "@/i18n/use-i18n";
import type { FavoritePair } from "@/lib/types";

export function FavoritePartitionEditors({
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
