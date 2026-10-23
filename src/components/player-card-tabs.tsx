"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "cn";

export function PlayerCardTabs({
  slug,
  athleteId,
  active,
}: {
  slug: string;
  athleteId: string;
  active: "card" | "matchup";
}) {
  const { t } = useI18n();
  const base = `/events/${slug}/${athleteId}`;

  return (
    <nav
      className="mt-4 flex gap-1 rounded-lg border bg-muted/40 p-1"
      aria-label={t.rate.title}
    >
      <Link
        href={base}
        className={cn(
          "flex-1 rounded-md px-3 py-2 text-center text-xs font-medium sm:text-sm",
          active === "card"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.rate.title}
      </Link>
      <Link
        href={`${base}/matchup`}
        className={cn(
          "flex-1 rounded-md px-3 py-2 text-center text-xs font-medium sm:text-sm",
          active === "matchup"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t.matchup.tab}
      </Link>
    </nav>
  );
}
