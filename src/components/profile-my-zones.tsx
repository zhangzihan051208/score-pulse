"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import type { ProfileZoneSummary } from "@/app/api/profile/zones/route";

type Payload = {
  zones?: ProfileZoneSummary[];
  totals?: {
    heat: number;
    zones: number;
    items: number;
    ratings: number;
  };
};

export function ProfileMyZones() {
  const { t } = useI18n();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/zones")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => setData(d))
      .catch(() => setData({ zones: [], totals: { heat: 0, zones: 0, items: 0, ratings: 0 } }))
      .finally(() => setLoading(false));
  }, []);

  const zones = data?.zones ?? [];
  const totals = data?.totals;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t.profile.myZonesTitle}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/zones" className="text-xs font-medium text-muted-foreground hover:text-primary hover:underline">
            {t.zones.title} →
          </Link>
          <Link href="/zones/create" className="text-xs font-medium text-primary hover:underline">
            {t.profile.myZonesCreate}
          </Link>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t.profile.myZonesHint}</p>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.auth.loading}</p>
      ) : (
        <>
          {totals && totals.zones > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border bg-primary/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.profile.myZonesHeatTotal}
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {totals.heat.toFixed(0)}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{t.profile.myZonesCount}</p>
                <p className="font-semibold tabular-nums">{totals.zones}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{t.zones.items}</p>
                <p className="font-semibold tabular-nums">{totals.items}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{t.event.ratings}</p>
                <p className="font-semibold tabular-nums">{totals.ratings}</p>
              </div>
            </div>
          ) : null}

          {zones.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              {t.profile.myZonesEmpty}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {zones.map((z) => (
                <li key={z.slug}>
                  <Link
                    href={`/zones/${z.slug}`}
                    className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-primary/40"
                  >
                    {z.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={z.cover_url}
                        alt=""
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {z.title.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{z.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.zones.categories[z.category as keyof typeof t.zones.categories] ??
                          z.category}{" "}
                        · {z.item_count} {t.zones.items} · {z.rating_count}{" "}
                        {t.event.ratings}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-muted-foreground">{t.zones.heat}</p>
                      <p className="text-base font-bold tabular-nums text-primary">
                        {z.heat_score.toFixed(0)}
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={`/zones/${z.slug}/manage`}
                    className="mt-1 inline-block pl-1 text-[11px] text-muted-foreground hover:text-primary"
                  >
                    {t.zones.manage} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
