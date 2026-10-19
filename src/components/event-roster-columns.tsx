"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall, ScoreRows } from "@/components/score-rows";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/data";
import { performancesBySide, type RosterEntry } from "@/lib/event-spotlight";
import type { CommunityState } from "@/lib/store";
import type { MatchEvent } from "@/lib/types";

function RosterPlayerCard({
  event,
  entry,
}: {
  event: MatchEvent;
  entry: RosterEntry;
}) {
  const { locale, t } = useI18n();
  const { performance: p, athlete, merged } = entry;
  const overall = overallScore(merged.avg, merged.positionKey);
  const yours = merged.mine
    ? overallScore(merged.mine, merged.positionKey)
    : null;

  return (
    <article className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <PlayerAvatar athlete={athlete} size="sm" />
          <div className="min-w-0">
            <Link
              href={`/events/${event.slug}/${athlete.id}`}
              className="font-medium leading-tight hover:text-primary hover:underline"
            >
              {athlete.name}
            </Link>
            <p className="truncate text-[11px] text-muted-foreground">
              {tx(p.role, locale)}
              {athlete.jerseyNumber ? ` · #${athlete.jerseyNumber}` : ""}
              {p.result ? ` · ${tx(p.result, locale)}` : ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Overall value={overall} />
          <p className="text-[10px] text-muted-foreground">
            {merged.count.toLocaleString()} {t.event.ratings}
          </p>
          {yours != null && (
            <p className="text-[10px] font-medium text-primary">
              {t.event.yourScore}: {yours.toFixed(1)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2.5">
        <ScoreRows positionKey={merged.positionKey} scores={merged.avg} compact />
      </div>
    </article>
  );
}

function RosterColumn({
  event,
  title,
  entries,
}: {
  event: MatchEvent;
  title: string;
  entries: RosterEntry[];
}) {
  const { t } = useI18n();

  return (
    <div className="min-w-0 rounded-xl border bg-card">
      <div className="border-b px-3 py-2.5">
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {entries.length} {t.event.squadPlayers}
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">{t.event.squadEmpty}</p>
      ) : (
        <ul className="space-y-2 p-3">
          {entries.map((entry) => (
            <li key={entry.athlete.id}>
              <RosterPlayerCard event={event} entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EventRosterColumns({
  event,
  state,
}: {
  event: MatchEvent;
  state: CommunityState;
}) {
  const { locale, t } = useI18n();
  const { home, away } = performancesBySide(event, state, locale);
  const homeTitle = event.homeTeamName ?? t.event.homeSpotlight;
  const awayTitle = event.awayTeamName ?? t.event.awaySpotlight;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide">{t.event.squadRatings}</h2>
        <p className="text-xs text-muted-foreground">{t.event.squadRatingsLead}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <RosterColumn event={event} title={homeTitle} entries={home} />
        <RosterColumn event={event} title={awayTitle} entries={away} />
      </div>
    </section>
  );
}
