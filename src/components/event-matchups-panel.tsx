"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommunity } from "@/hooks/use-community";
import { positionRoleLabel } from "@/i18n/position-dims";
import { useI18n } from "@/i18n/use-i18n";
import { buildEventMatchups } from "@/lib/matchup-pairs";
import type { MatchEvent } from "@/lib/types";

export function EventMatchupsPanel({
  event,
  fullPage = false,
}: {
  event: MatchEvent;
  fullPage?: boolean;
}) {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const pairs = useMemo(
    () => buildEventMatchups(event, state, locale),
    [event, state, locale],
  );

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">
        {fullPage ? t.event.matchupsTab : t.matchup.allInMatch}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {fullPage ? t.event.matchupsLead : t.matchup.eventLead}
      </p>
      {pairs.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
          {t.matchup.noCounterpart}
        </p>
      ) : null}
      {pairs.length > 0 ? (
      <ul className="mt-3 space-y-2">
        {pairs.map((p) => {
          const key = `${p.positionKey}-${p.slot}-${p.home.athlete.id}`;
          return (
            <li
              key={key}
              className="flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.home.athlete.name}{" "}
                  <span className="font-normal text-muted-foreground">{t.matchup.vs}</span>{" "}
                  {p.away.athlete.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {positionRoleLabel(locale, p.positionKey)}
                </p>
              </div>
              <Link
                href={`/events/${event.slug}/${p.home.athlete.id}/matchup`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t.matchup.viewCompare} →
              </Link>
            </li>
          );
        })}
      </ul>
      ) : null}
    </section>
  );
}
