"use client";

import { EventRosterColumns } from "@/components/event-roster-columns";
import { EventThreadShell } from "@/components/event-thread-shell";
import { useCommunity } from "@/hooks/use-community";
import type { MatchEvent } from "@/lib/types";

export function EventThread({ event }: { event: MatchEvent }) {
  const { state } = useCommunity();

  return (
    <EventThreadShell event={event} active="squad">
      <EventRosterColumns event={event} state={state} />
    </EventThreadShell>
  );
}
