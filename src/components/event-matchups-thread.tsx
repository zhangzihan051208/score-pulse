"use client";

import { EventMatchupsPanel } from "@/components/event-matchups-panel";
import { EventThreadShell } from "@/components/event-thread-shell";
import type { MatchEvent } from "@/lib/types";

export function EventMatchupsThread({ event }: { event: MatchEvent }) {
  return (
    <EventThreadShell event={event} active="matchups">
      <EventMatchupsPanel event={event} fullPage />
    </EventThreadShell>
  );
}
