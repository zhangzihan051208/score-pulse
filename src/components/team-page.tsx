"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { PlayerAvatar } from "@/components/player-avatar";
import { StatusPill } from "@/components/status-pill";
import { useI18n } from "@/i18n/use-i18n";
import type { TeamHub } from "@/lib/team-hub";
import type { MatchEvent } from "@/lib/types";

export function TeamPageInner({
  teamId,
  sport,
  nameHint,
}: {
  teamId: string;
  sport: "nba" | "soccer";
  nameHint?: string;
}) {
  const { t } = useI18n();
  const [hub, setHub] = useState<TeamHub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ sport });
    if (nameHint) params.set("name", nameHint);
    fetch(`/api/teams/${encodeURIComponent(teamId)}?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { team?: TeamHub } | null) => setHub(d?.team ?? null))
      .finally(() => setLoading(false));
  }, [nameHint, sport, teamId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-10 text-sm text-muted-foreground">
        {t.auth.loading}
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-10">
        <p className="text-sm text-muted-foreground">{t.team.notFound}</p>
        <Link href="/search" className="mt-3 inline-block text-sm text-primary hover:underline">
          {t.nav.search}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>

      <header className="mt-4 flex gap-4">
        {hub.badgeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hub.badgeUrl}
            alt=""
            className="size-16 object-contain sm:size-20"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-xl bg-muted text-lg font-bold sm:size-20">
            {hub.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{hub.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[hub.league, hub.country, hub.formed ? `${t.team.since} ${hub.formed}` : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {hub.stadium ? (
            <p className="mt-1 text-xs text-muted-foreground">{hub.stadium}</p>
          ) : null}
        </div>
      </header>

      {hub.description ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{hub.description}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.team.roster}
        </h2>
        {hub.roster.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.team.rosterEmpty}</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {hub.roster.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <PlayerAvatar
                  athlete={{
                    name: p.name,
                    shortName: p.name.slice(0, 2),
                    photoUrl: p.photoUrl,
                    jerseyNumber: p.number,
                  }}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.number ? `#${p.number}` : null, p.position].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TeamEventsSection title={t.team.recent} events={hub.recent} hub={hub} sport={sport} />
      <TeamEventsSection title={t.team.upcoming} events={hub.upcoming} hub={hub} sport={sport} />

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.team.honors}
        </h2>
        {hub.honors.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.team.honorsEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {hub.honors.map((h, i) => (
              <li key={`${h.title}-${i}`} className="rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{h.title}</span>
                {(h.season || h.league) && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {[h.season, h.league].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TeamEventsSection({
  title,
  events,
  hub,
  sport,
}: {
  title: string;
  events: TeamHub["recent"];
  hub: TeamHub;
  sport: "nba" | "soccer";
}) {
  const { t } = useI18n();
  if (events.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {events.map((ev) => {
          const pseudoEvent: MatchEvent = {
            id: ev.id,
            slug: ev.slug ?? ev.id,
            sport,
            title: { en: ev.title, zh: ev.title, es: ev.title, ja: ev.title },
            subtitle: { en: "", zh: "", es: "", ja: "" },
            venue: { en: "", zh: "", es: "", ja: "" },
            startAt: ev.date ?? "",
            status: ev.status,
            statusDetail: ev.statusDetail,
            summary: { en: "", zh: "", es: "", ja: "" },
            cover: "",
            performances: [],
            homeTeamName: ev.homeTeam,
            awayTeamName: ev.awayTeam,
            homeScore: ev.homeScore,
            awayScore: ev.awayScore,
            homeTeamId: ev.isHome ? hub.id : undefined,
            awayTeamId: ev.isHome ? undefined : hub.id,
            live: true,
          };
          const href = ev.slug ? `/events/${ev.slug}` : undefined;
          return (
            <li key={ev.id} className="rounded-xl border bg-card px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <StatusPill status={ev.status} />
                {ev.date ? (
                  <span className="text-xs text-muted-foreground">{ev.date}</span>
                ) : null}
              </div>
              <MatchScoreboard event={pseudoEvent} size="sm" />
              {href ? (
                <Link
                  href={href}
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  {t.team.openMatch}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
