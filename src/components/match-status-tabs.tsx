"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import type { EventStatus, MatchEvent } from "@/lib/types";
import { cn } from "cn";

const ORDER: EventStatus[] = ["ended", "live", "upcoming"];

function preferredStatus(events: MatchEvent[]): EventStatus {
  if (events.some((event) => event.status === "live")) return "live";
  if (events.some((event) => event.status === "upcoming")) return "upcoming";
  return "ended";
}

export function useMatchStatus(events: MatchEvent[]) {
  const [status, setStatus] = useState<EventStatus>("live");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched || events.length === 0) return;
    setStatus(preferredStatus(events));
  }, [events, touched]);

  const visible = useMemo(
    () => events.filter((event) => event.status === status),
    [events, status],
  );

  return {
    status,
    setStatus: (next: EventStatus) => {
      setTouched(true);
      setStatus(next);
    },
    visible,
  };
}

export function MatchStatusTabs({
  events,
  status,
  onChange,
}: {
  events: MatchEvent[];
  status: EventStatus;
  onChange: (status: EventStatus) => void;
}) {
  const { t } = useI18n();
  const label: Record<EventStatus, string> = {
    ended: t.board.statusEnded,
    live: t.board.statusLive,
    upcoming: t.board.statusUpcoming,
  };
  const counts = useMemo(() => {
    const out: Record<EventStatus, number> = { ended: 0, live: 0, upcoming: 0 };
    for (const event of events) out[event.status] += 1;
    return out;
  }, [events]);

  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {ORDER.map((id) => {
        const active = status === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label[id]}
            <span className={cn("ml-1.5 tabular-nums", active ? "text-primary-foreground/80" : "")}>
              {counts[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
