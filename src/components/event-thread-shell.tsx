"use client";

import Link from "next/link";
import { EventSquadPageTabs } from "@/components/event-squad-page-tabs";
import { MatchScoreboard } from "@/components/match-scoreboard";
import { MatchTakePanel } from "@/components/match-take-panel";
import { StatusPill } from "@/components/status-pill";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { formatWhen } from "@/lib/score-display";
import type { ReactNode } from "react";
import type { MatchEvent } from "@/lib/types";

export function EventThreadShell({
  event,
  active,
  children,
}: {
  event: MatchEvent;
  active: "squad" | "matchups";
  children: ReactNode;
}) {
  const { locale, t } = useI18n();

  return (
    <div>
      <section className={`bg-gradient-to-r ${event.cover} text-white`}>
        <div className="mx-auto max-w-3xl px-3 py-8">
          <Link
            href={`/boards/${event.sport}`}
            className="text-xs text-white/80 hover:underline"
          >
            ← {t.sports[event.sport]}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={event.status} />
            <span className="text-sm text-white/80">{tx(event.subtitle, locale)}</span>
          </div>
          <div className="mt-4 rounded-xl bg-black/25 px-4 py-4 backdrop-blur-sm">
            <MatchScoreboard event={event} size="lg" inverted />
          </div>
          <p className="mt-3 text-sm text-white/85">{tx(event.summary, locale)}</p>
          <p className="mt-2 text-xs text-white/70">
            {tx(event.venue, locale)} · {formatWhen(event.startAt, locale)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-4 px-3 py-6">
        <MatchTakePanel event={event} />
        <EventSquadPageTabs slug={event.slug} active={active} />
        {children}
      </div>
    </div>
  );
}
