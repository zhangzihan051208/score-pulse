import { tx } from "@/lib/copy";
import type { Locale, Performance } from "@/lib/types";

export function PlayerMatchStats({
  stats,
  locale,
}: {
  stats: Performance["stats"];
  locale: Locale;
}) {
  if (stats.length === 0) return null;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => {
        const label = tx(stat.label, locale);
        const count = Number.parseInt(stat.value, 10) || 0;
        const accent =
          count > 0 && label === "Yellow cards"
            ? "text-amber-600 dark:text-amber-400"
            : count > 0 && label === "Red cards"
              ? "text-red-600 dark:text-red-400"
              : "text-foreground";
        return (
          <div
            key={label}
            className="rounded-xl border bg-card px-2 py-2.5 text-center"
          >
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className={`mt-0.5 text-xl font-semibold tabular-nums ${accent}`}>
              {stat.value}
            </dd>
            {stat.detail ? (
              <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                {stat.detail}
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-transparent" aria-hidden>
                —
              </p>
            )}
          </div>
        );
      })}
    </dl>
  );
}
