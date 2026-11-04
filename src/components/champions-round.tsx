"use client";

import Link from "next/link";
import { TeamCrest } from "@/components/team-crest";
import { useI18n } from "@/i18n/use-i18n";
import { useLeagueTable } from "@/hooks/use-league-table";
import { findStanding, type RoundMatch } from "@/lib/league-table";
import type { MatchEvent } from "@/lib/types";

function dayLabel(isoDay: string, locale: string) {
  const loc =
    locale === "zh"
      ? "zh-CN"
      : locale === "ja"
        ? "ja-JP"
        : locale === "es"
          ? "es-ES"
          : locale === "de"
            ? "de-DE"
            : "en-US";
  return new Intl.DateTimeFormat(loc, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDay}T12:00:00Z`));
}

function eventHref(match: RoundMatch, events: MatchEvent[]) {
  const hit = events.find(
    (event) =>
      match.homeId &&
      event.homeTeamId === match.homeId &&
      event.awayTeamId === match.awayId,
  );
  return hit ? `/events/${hit.slug}` : null;
}

export function ChampionsRound({ events }: { events: MatchEvent[] }) {
  const { locale, t } = useI18n();
  const table = useLeagueTable("champions-league");
  const matches = table?.round?.matches ?? [];
  if (!table || matches.length === 0) return null;

  const days = new Map<string, RoundMatch[]>();
  for (const match of matches) {
    const day = match.startAt.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), match]);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.table.roundTitle}
        </h2>
        <Link
          href="/boards/soccer/champions-league/table"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t.table.standings}
        </Link>
      </div>
      {[...days.entries()].map(([day, rows]) => (
        <div key={day} className="overflow-hidden rounded-xl border">
          <p className="border-b bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            {dayLabel(day, locale)}
          </p>
          <ul>
            {rows.map((match) => {
              const href = eventHref(match, events);
              const home = findStanding(table, match.homeId, match.homeName);
              const away = findStanding(table, match.awayId, match.awayName);
              const scored = match.homeScore != null && match.awayScore != null && match.status !== "upcoming";
              const inner = (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
                  <span className="flex items-center justify-end gap-2 text-right text-sm">
                    <span className="truncate font-medium">{match.homeName}</span>
                    {home ? (
                      <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                        #{home.rank}
                      </span>
                    ) : null}
                    <TeamCrest name={match.homeName} badgeUrl={match.homeBadge} size="sm" />
                  </span>
                  <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">
                    {scored ? `${match.homeScore}–${match.awayScore}` : "vs"}
                  </span>
                  <span className="flex items-center gap-2 text-left text-sm">
                    <TeamCrest name={match.awayName} badgeUrl={match.awayBadge} size="sm" />
                    {away ? (
                      <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                        #{away.rank}
                      </span>
                    ) : null}
                    <span className="truncate font-medium">{match.awayName}</span>
                  </span>
                </div>
              );
              return (
                <li key={match.id} className="border-t first:border-t-0">
                  {href ? (
                    <Link href={href} className="block hover:bg-muted/40">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
