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
import { cn } from "cn";

export function HonorBoard({
  kind,
  sport,
}: {
  kind: HonorBoardKind;
  sport: Sport | "all";
}) {
  const { locale, t } = useI18n();
  const [entries, setEntries] = useState<ReputationCard[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
      <ol className="mt-3 space-y-2">
        {entries.map((entry) => {
          const open = openId === entry.id;
          const labels = entry.dimIds.map((id) =>
            entry.positionKey
              ? dimLabel(locale, entry.positionKey, id)
              : (t.dims[entry.sport]?.[id] ?? id),
          );
          return (
            <li key={entry.id} className="rounded-lg border">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : entry.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30"
              >
                <span className="w-7 shrink-0 text-center text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.sports[entry.sport]} · {entry.subtitle}
                  </p>
                </div>
                <Overall value={entry.overall} />
              </button>
              {open ? (
                <div className="border-t px-3 py-3">
                  <p className="text-sm leading-6">{copy(entry.honors)}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr] sm:items-center">
                    <DimensionRadar
                      dimIds={entry.dimIds}
                      dimLabels={labels}
                      size={200}
                      series={[
                        {
                          label: entry.name,
                          scores: entry.scores,
                          stroke: "oklch(0.58 0.19 38)",
                          fill: "oklch(0.58 0.19 38 / 0.22)",
                        },
                      ]}
                    />
                    <ul className="space-y-2">
                      {entry.dimIds.map((id, i) => (
                        <li key={id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{labels[i]}</span>
                          <span className="font-semibold tabular-nums">
                            {(entry.scores[id] ?? 0).toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t.rankings.fanTakes}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {entry.takes.map((take) => (
                      <li key={take.id} className="rounded-md bg-muted/40 px-3 py-2 text-sm leading-6">
                        {copy(take)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t.rankings.blendHint}
                    {entry.matchSamples > 0
                      ? ` · ${entry.matchSamples}`
                      : ""}
                  </p>
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className={cn(
                        "mt-3 inline-flex text-xs font-medium text-primary hover:underline",
                      )}
                    >
                      {entry.positionKey ? t.player.profileLink : t.search.clubPage}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
