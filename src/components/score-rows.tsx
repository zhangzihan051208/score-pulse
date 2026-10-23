"use client";

import { dimLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { dimensionIds } from "@/lib/position-ratings";
import type { PositionKey, ScoreMap } from "@/lib/types";

export function ScoreRows({
  positionKey,
  scores,
  compact = false,
}: {
  positionKey: PositionKey;
  scores: ScoreMap;
  compact?: boolean;
}) {
  const { locale } = useI18n();
  const dims = dimensionIds(positionKey);

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {dims.map((id) => {
        const value = scores[id] ?? 0;
        return (
          <div
            key={id}
            className="grid grid-cols-[5.5rem_1fr_2.25rem] items-center gap-2"
          >
            <span className="truncate text-xs text-muted-foreground">
              {dimLabel(locale, positionKey, id)}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(value / 10) * 100}%` }}
              />
            </div>
            <span className="text-right text-xs font-semibold tabular-nums">
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Overall({ value, digits = 1 }: { value: number; digits?: number }) {
  return (
    <span className="text-2xl font-bold tabular-nums text-primary">
      {value.toFixed(digits)}
    </span>
  );
}
