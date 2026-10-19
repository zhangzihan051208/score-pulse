"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { StatusPill } from "@/components/status-pill";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import { leagueLabel } from "@/i18n/league-labels";
import { tx } from "@/lib/copy";
import type { MatchEvent } from "@/lib/types";

type TeamHit = {
  id: string;
  name: string;
  league?: string;
  sport: "nba" | "soccer";
  hotWeight?: number;
};

type PlayerHit = {
  athleteId: string;
  athleteName: string;
  team?: string;
  eventSlug: string;
  eventTitle: string;
  leagueLabel: string;
  sport: "nba" | "soccer";
};

export function SearchPageInner() {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState("");
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [teams, setTeams] = useState<TeamHit[]>([]);
  const [players, setPlayers] = useState<PlayerHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(id);
  }, [q]);

  const runSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setMatches([]);
      setTeams([]);
      setPlayers([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: term, limit: "24" });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        matches?: MatchEvent[];
        teams?: TeamHit[];
        players?: PlayerHit[];
      };
      setMatches(data.matches ?? []);
      setTeams(data.teams ?? []);
      setPlayers(data.players ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(debounced);
  }, [debounced, runSearch]);

  return (
    <div className="mx-auto max-w-3xl px-3 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.search.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.search.lead}</p>

      <div className="mt-6">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          autoFocus
          className="h-11 text-base"
        />
        <p className="mt-2 text-xs text-muted-foreground">{t.search.hint}</p>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-muted-foreground">{t.auth.loading}</p>
      )}

      {!loading &&
        debounced.length >= 2 &&
        matches.length === 0 &&
        teams.length === 0 &&
        players.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t.search.empty}</p>
      )}

      {teams.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.search.clubs}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/teams/${team.id}?sport=${team.sport}&name=${encodeURIComponent(team.name)}`}
                  className="block rounded-xl border bg-card px-4 py-3 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{team.name}</p>
                    {(team.hotWeight ?? 0) >= 85 && (
                      <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {t.search.popularTag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {team.league ?? t.sports[team.sport]} · {t.search.clubPage}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {matches.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.search.matches}
          </h2>
          <ul className="mt-3 space-y-2">
            {matches.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="block rounded-xl border bg-card px-4 py-3 hover:bg-muted/40"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={event.status} />
                  </div>
                  {event.live && event.homeTeamName ? (
                    <MatchScoreboard event={event} size="sm" />
                  ) : (
                    <span className="font-semibold">{tx(event.title, locale)}</span>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.leagueSlug
                      ? leagueLabel(locale, event.leagueSlug)
                      : tx(event.subtitle, locale)}{" "}
                    · {t.sports[event.sport]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {players.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.search.players}
          </h2>
          <ul className="mt-3 space-y-2">
            {players.map((p) => (
              <li key={`${p.eventSlug}-${p.athleteId}`}>
                <Link
                  href={`/events/${p.eventSlug}/${p.athleteId}`}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-semibold">{p.athleteName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.eventTitle}
                      {p.team ? ` · ${p.team}` : ""} · {p.leagueLabel}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-primary">{t.home.rate}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
