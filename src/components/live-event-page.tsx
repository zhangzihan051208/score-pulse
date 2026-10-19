"use client";

import { EventThread } from "@/components/event-thread";
import { useLiveEvent } from "@/hooks/use-live-events";
import { useI18n } from "@/i18n/use-i18n";
import type { MatchEvent } from "@/lib/types";

export function LiveEventPage({
  slug,
  initial,
}: {
  slug: string;
  initial: MatchEvent;
}) {
  const { t } = useI18n();
  const { event, syncedAt } = useLiveEvent(slug, initial);
  const data = event ?? initial;

  return (
    <div>
      {syncedAt && (
        <p className="mx-auto max-w-3xl px-3 pt-2 text-[11px] text-muted-foreground">
          {t.home.liveSyncHint}{" "}
          {new Date(syncedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      <EventThread event={data} />
    </div>
  );
}
