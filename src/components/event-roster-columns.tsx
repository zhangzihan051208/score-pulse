"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { useEventTakesSummary } from "@/hooks/use-event-takes-summary";
import { localTakesForAthlete, topEngagementTake } from "@/lib/event-spotlight";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { overallScore } from "@/lib/score-display";
import { averageScores } from "@/lib/score-aggregate";
import { dimensionIds } from "@/lib/position-ratings";
import { playerRoleSubtitle } from "@/lib/player-meta";
import { performancesBySide, type RosterEntry } from "@/lib/event-spotlight";
import type { CommunityState } from "@/lib/store";
import type { CommunityTake } from "@/components/community-ratings-panel";
import type { MatchEvent } from "@/lib/types";

function RosterPlayerCard({
  event,
  entry,
  state,
  remoteTakes,
}: {
  event: MatchEvent;
  entry: RosterEntry;
  state: CommunityState;
  remoteTakes?: CommunityTake[];
}) {
  const { locale, t } = useI18n();
  const { performance: p, athlete, merged } = entry;
  const liveAvg =
    remoteTakes && remoteTakes.length > 0
      ? averageScores(
          remoteTakes.map((take) => take.scores),
          [...dimensionIds(merged.positionKey)],
        )
      : null;
  const overall = overallScore(liveAvg ?? merged.avg, merged.positionKey);
  const ratingCount = liveAvg ? remoteTakes!.length : merged.count;
  const local = localTakesForAthlete(event, athlete.id, state, locale);
  const takes = remoteTakes && remoteTakes.length > 0 ? remoteTakes : local;
  const topTake = topEngagementTake(takes, merged.positionKey);

  return (
    <li>
      <Link
        href={`/events/${event.slug}/${athlete.id}`}
        className="block rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
      >
        <div className="flex items-start gap-2.5">
          <PlayerAvatar athlete={athlete} size="default" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium leading-tight">{athlete.name}</p>
                <p
                  className="truncate text-[11px] text-muted-foreground"
                  title={playerRoleSubtitle(locale, athlete, p, merged.positionKey, {
                    includePositionGuide: false,
                  })}
                >
                  {playerRoleSubtitle(locale, athlete, p, merged.positionKey, {
                    includePositionGuide: false,
                  })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Overall value={overall} />
                <p className="text-[10px] text-muted-foreground">
                  {ratingCount.toLocaleString()} {t.event.ratings}
                </p>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-muted/45 px-2.5 py-2">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {t.event.hotTake}
              </p>
              {topTake?.body ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed">{topTake.body}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{t.event.noHotTake}</p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
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
  const { byAthlete } = useEventTakesSummary(event.id);
  const homeTitle = event.homeTeamName ?? t.event.homeSpotlight;
  const awayTitle = event.awayTeamName ?? t.event.awaySpotlight;
  const [side, setSide] = useState<"home" | "away">("home");
  const entries = side === "home" ? home : away;
  const activeTitle = side === "home" ? homeTitle : awayTitle;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide">{t.event.squadRatings}</h2>
        <p className="text-xs text-muted-foreground">{t.event.squadRatingsLeadCompact}</p>
      </div>

      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setSide("home")}
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            side === "home"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="block truncate">{homeTitle}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {home.length} {t.event.squadPlayers}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSide("away")}
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            side === "away"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="block truncate">{awayTitle}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {away.length} {t.event.squadPlayers}
          </span>
        </button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-3 py-2">
          <h3 className="font-semibold leading-tight">{activeTitle}</h3>
        </div>
        {entries.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {t.event.squadEmpty}
          </p>
        ) : (
          <ul className="space-y-2 p-3">
            {entries.map((entry) => (
              <RosterPlayerCard
                key={entry.athlete.id}
                event={event}
                entry={entry}
                state={state}
                remoteTakes={byAthlete[entry.athlete.id]}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
