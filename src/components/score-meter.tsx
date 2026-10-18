import { DIMENSIONS } from "@/lib/data";
import type { ScoreMap } from "@/lib/types";

export function ScoreMeter({
  scores,
  compact = false,
}: {
  scores: ScoreMap;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {DIMENSIONS.map((dim) => {
        const value = scores[dim.id];
        return (
          <div key={dim.id} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2">
            <span className="text-xs text-muted-foreground">{dim.label}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(value / 10) * 100}%` }}
              />
            </div>
            <span className="text-right text-xs font-medium tabular-nums">
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function OverallPill({ value }: { value: number }) {
  const tone =
    value >= 8.5
      ? "bg-emerald-700 text-white"
      : value >= 7.5
        ? "bg-primary text-primary-foreground"
        : value >= 6
          ? "bg-amber-500 text-black"
          : "bg-rose-600 text-white";
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-lg px-2 py-1 text-lg font-semibold tabular-nums ${tone}`}
    >
      {value.toFixed(1)}
    </span>
  );
}
