"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { Overall } from "@/components/score-rows";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel } from "@/i18n/position-dims";
import type { HonorBoardKind } from "@/lib/reputation/catalog";
import type { ReputationCard } from "@/lib/reputation/types";
import type { Sport } from "@/lib/types";

export function HonorBoard({
  kind,
  sport,
}: {
  kind: HonorBoardKind;
  sport: Sport | "all";
}) {
  const { locale, t } = useI18n();
  const [entries, setEntries] = useState<ReputationCard[] | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams({ kind });
    if (sport !== "all") sp.set("sport", sport);
    let cancelled = false;
    fetch(`/api/honor?${sp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entries?: ReputationCard[] } | null) => {
        if (!cancelled) setEntries(d?.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, sport]);

  if (!entries) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.common.loadingPage}</p>;
  }
  if (entries.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.rankings.empty}</p>;
  }

  const copy = (text: { en: string; zh: string }) =>
    locale === "zh" ? text.zh : text.en;

  return (
    <div className="mt-4">
      <p className="text-xs leading-5 text-muted-foreground">{t.rankings.blendHint}</p>
      <ol className="mt-3 space-y-3">
        {entries.map((entry, index) => {
          const labels = entry.dimIds.map((id) =>
            entry.positionKey
              ? dimLabel(locale, entry.positionKey, id)
              : (t.dims[entry.sport]?.[id] ?? id),
          );
          const showSport =
            sport === "all" && (index === 0 || entries[index - 1]?.sport !== entry.sport);
          return (
            <li key={`${entry.sport}:${entry.id}`} className="rounded-lg border p-3">
              {showSport ? (
                <p className="mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {t.sports[entry.sport]}
                </p>
              ) : null}
              <div className="flex items-start gap-3">
                <span className="w-7 shrink-0 pt-0.5 text-center text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  {entry.href ? (
                    <Link href={entry.href} className="truncate font-medium hover:underline">
                      {entry.name}
                    </Link>
                  ) : (
                    <p className="truncate font-medium">{entry.name}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {sport === "all" ? `${t.sports[entry.sport]} · ` : ""}
                    {entry.subtitle}
                  </p>
                </div>
                <Overall value={entry.overall} />
              </div>
              <p className="mt-2 text-sm leading-6">{copy(entry.honors)}</p>
              <div className="mt-2 grid grid-cols-[148px_minmax(0,1fr)] items-center gap-2">
                <DimensionRadar
                  dimIds={entry.dimIds}
                  dimLabels={labels}
                  size={148}
                  showLabels={false}
                  series={[
                    {
                      label: entry.name,
                      scores: entry.scores,
                      stroke: "oklch(0.58 0.19 38)",
                      fill: "oklch(0.58 0.19 38 / 0.22)",
                    },
                  ]}
                />
                <ul className="min-w-0 space-y-1.5">
                  {entry.dimIds.map((id, axis) => (
                    <li key={id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate text-muted-foreground">{labels[axis]}</span>
                      <span className="font-semibold tabular-nums">
                        {(entry.scores[id] ?? 0).toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="mt-2 space-y-1.5">
                {entry.takes.map((take) => (
                  <li key={take.id} className="text-sm leading-6">
                    {copy(take)}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
