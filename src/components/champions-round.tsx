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
    <section className="space-y-2">
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
      <div className="max-h-36 overflow-y-auto rounded-xl border">
        {[...days.entries()].map(([day, rows]) => (
          <div key={day}>
            <p className="sticky top-0 border-b bg-muted/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
              {dayLabel(day, locale)}
            </p>
            <ul className="grid sm:grid-cols-2">
              {rows.map((match) => {
                const href = eventHref(match, events);
                const home = findStanding(table, match.homeId, match.homeName);
                const away = findStanding(table, match.awayId, match.awayName);
                const scored = match.homeScore != null && match.awayScore != null && match.status !== "upcoming";
                const inner = (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-2.5 py-1">
                    <span className="flex min-w-0 items-center justify-end gap-1.5 text-right text-xs">
                      <span className="truncate">{match.homeName}</span>
                      {home ? (
                        <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                          #{home.rank}
                        </span>
                      ) : null}
                      <TeamCrest
                        name={match.homeName}
                        badgeUrl={match.homeBadge}
                        size="sm"
                        className="size-5"
                      />
                    </span>
                    <span className="min-w-8 text-center text-xs font-semibold tabular-nums">
                      {scored ? `${match.homeScore}–${match.awayScore}` : "vs"}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-left text-xs">
                      <TeamCrest
                        name={match.awayName}
                        badgeUrl={match.awayBadge}
                        size="sm"
                        className="size-5"
                      />
                      {away ? (
                        <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                          #{away.rank}
                        </span>
                      ) : null}
                      <span className="truncate">{match.awayName}</span>
                    </span>
                  </div>
                );
                return (
                  <li key={match.id} className="border-t">
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
      </div>
    </section>
  );
}
