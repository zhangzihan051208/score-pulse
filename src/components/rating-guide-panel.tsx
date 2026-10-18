"use client";

import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel, positionRoleLabel } from "@/i18n/position-dims";
import { dimensionIds, getPositionProfile } from "@/lib/position-ratings";
import type { PositionKey } from "@/lib/types";

export function RatingGuidePanel({ positionKey }: { positionKey: PositionKey }) {
  const { locale, t } = useI18n();
  const profile = getPositionProfile(positionKey);
  const dims = dimensionIds(positionKey);

  return (
    <details className="group rounded-lg border bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <span>{t.rate.ratingGuide}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t px-3 py-3 text-sm">
        <p className="text-muted-foreground leading-relaxed">
          {t.rate.ratingGuideLead.replace(
            "{role}",
            positionRoleLabel(locale, positionKey),
          )}
        </p>
        <ul className="space-y-1.5">
          {dims.map((id) => {
            const weight = profile.weights[id] ?? 0;
            return (
              <li
                key={id}
                className="flex items-baseline justify-between gap-2 text-xs sm:text-sm"
              >
                <span>{dimLabel(locale, positionKey, id)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {Math.round(weight * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground">{t.rate.overallWeighted}</p>
      </div>
    </details>
  );
}

/** One-line community dimension chips */
export function DimensionChips({
  positionKey,
  scores,
}: {
  positionKey: PositionKey;
  scores: Record<string, number>;
}) {
  const { locale } = useI18n();
  const dims = dimensionIds(positionKey);

  return (
    <div className="flex flex-wrap gap-1">
      {dims.map((id) => (
        <span
          key={id}
          className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] sm:text-xs"
          title={dimLabel(locale, positionKey, id)}
        >
          <span className="text-muted-foreground">
            {dimLabel(locale, positionKey, id).split(/\s|·/)[0]}{" "}
          </span>
          <span className="font-semibold tabular-nums">
            {(scores[id] ?? 0).toFixed(1)}
          </span>
        </span>
      ))}
    </div>
  );
}
