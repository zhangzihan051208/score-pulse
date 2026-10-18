"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { mapTsdbStatus } from "@/lib/thesportsdb";
import { StatusPill } from "@/components/status-pill";
import type { FixtureRow } from "@/lib/fixtures-sync";

export function ApiFixturesStrip() {
  const { t } = useI18n();
  const [fixtures, setFixtures] = useState<FixtureRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/fixtures")
      .then((r) => r.json())
      .then((data: { fixtures?: FixtureRow[] }) => {
        setFixtures(data.fixtures ?? []);
      })
      .catch(() => setFixtures([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || fixtures.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {t.home.apiFixtures}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fixtures.map((f) => {
          const title =
            f.str_event ||
            [f.str_home_team, f.str_away_team].filter(Boolean).join(" vs ");
          const status = mapTsdbStatus(f.str_status ?? undefined);
          const score =
            f.int_home_score != null && f.int_away_score != null
              ? `${f.int_home_score}-${f.int_away_score}`
              : null;
          return (
            <div
              key={f.id_event}
              className="flex shrink-0 flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <StatusPill status={status} />
                <span className="font-medium">{title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {f.sport === "nba" ? t.sports.nba : t.sports.soccer}
                {f.str_league ? ` · ${f.str_league}` : ""}
                {score ? ` · ${score}` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{t.home.apiFixturesHint}</p>
    </section>
  );
}
