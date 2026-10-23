"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "cn";

export function EventSquadPageTabs({
  slug,
  active,
}: {
  slug: string;
  active: "squad" | "matchups";
}) {
  const { t } = useI18n();

  return (
    <nav
      className="flex gap-1 rounded-xl border bg-muted/30 p-1"
      aria-label={t.event.squadRatings}
    >
      <Link
        href={`/events/${slug}`}
        className={cn(
          "min-w-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors",
          active === "squad"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.event.squadRatings}
      </Link>
      <Link
        href={`/events/${slug}/matchups`}
        className={cn(
          "min-w-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors",
          active === "matchups"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.event.matchupsTab}
      </Link>
    </nav>
  );
}
