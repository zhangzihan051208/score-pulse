"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { ZONE_CATEGORIES, type RatingZoneRow } from "@/lib/zones";

export function ZonesHubPageInner() {
  const { t } = useI18n();
  const [zones, setZones] = useState<RatingZoneRow[]>([]);
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    fetch(`/api/zones?${sp}`)
      .then((r) => (r.ok ? r.json() : { zones: [] }))
      .then((d: { zones?: RatingZoneRow[] }) => setZones(d.zones ?? []))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="mx-auto max-w-3xl px-3 py-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t.zones.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.zones.lead}</p>
        </div>
        <Link
          href="/zones/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          {t.zones.create}
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${!category ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          {t.zones.allCategories}
        </button>
        {ZONE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${category === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {t.zones.categories[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.common.loadingPage}</p>
      ) : zones.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t.zones.empty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {zones.map((z) => (
            <li key={z.id}>
              <Link
                href={`/zones/${z.slug}`}
                className="flex gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                {z.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={z.cover_url}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold">
                    {z.title.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{z.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.zones.categories[z.category as keyof typeof t.zones.categories] ??
                      z.category}{" "}
                    · {z.item_count} {t.zones.items} · {z.rating_count}{" "}
                    {t.event.ratings}
                  </p>
                  {z.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {z.description}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t.zones.heat}
                  </p>
                  <p className="text-xl font-bold tabular-nums text-primary">
                    {Number(z.heat_score).toFixed(0)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
