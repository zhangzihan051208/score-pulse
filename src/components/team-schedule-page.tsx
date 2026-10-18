"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import { tx } from "@/lib/copy";
import { formatWhen } from "@/lib/data";
import {
  parsePartition,
  pathToPartition,
  primaryTeamForPartition,
} from "@/lib/favorite-teams";
import type { MatchEvent } from "@/lib/types";

export function TeamSchedulePageInner({ path }: { path: string }) {
  const partition = pathToPartition(path);
  const { sport, leagueSlug } = parsePartition(partition);
  const { locale, t } = useI18n();
  const { favorites } = useFavoriteTeams();
  const team = primaryTeamForPartition(favorites, partition);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team) {
      setLoading(false);
      return;
    }
    const params = new URLSearchParams({
      teamId: team.id,
      teamName: team.name,
      sport,
      limit: "50",
    });
    fetch(`/api/teams/schedule?${params}`)
      .then((r) => r.json())
      .then((d: { events?: MatchEvent[] }) => {
        setEvents(
          (d.events ?? []).filter((e) =>
            leagueSlug && sport === "soccer"
              ? e.leagueSlug === leagueSlug
              : true,
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [leagueSlug, sport, team]);

  const heading =
    sport === "nba"
      ? t.sports.nba
      : leagueSlug
        ? leagueLabel(locale, leagueSlug)
        : t.sports.soccer;

  if (!team) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10">
        <p className="text-sm text-muted-foreground">{t.teams.noPrimary}</p>
        <Link href="/my-teams" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t.teams.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-8">
      <Link href="/my-teams" className="text-xs text-muted-foreground hover:underline">
        ← {t.teams.title}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{team.name}</h1>
      <p className="text-sm text-muted-foreground">
        {heading} · {t.teams.fullSchedule}
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.auth.loading}</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.teams.scheduleEmpty}</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="block rounded-xl border bg-card px-4 py-3 hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={event.status} />
                  <span className="font-semibold">{tx(event.title, locale)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.leagueSlug
                    ? leagueLabel(locale, event.leagueSlug)
                    : tx(event.subtitle, locale)}{" "}
                  · {formatWhen(event.startAt, locale)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
