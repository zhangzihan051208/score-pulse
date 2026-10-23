"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Overall } from "@/components/score-rows";
import { PlayerAvatar } from "@/components/player-avatar";
import { useI18n } from "@/i18n/use-i18n";
import { formatWhen } from "@/lib/data";
import { playerHubHref } from "@/lib/player-routes";
import type { ProfileRatingItem } from "@/app/api/profile/ratings/route";

export function ProfileRatingHistory() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<ProfileRatingItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/ratings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: ProfileRatingItem[] } | null) => {
        setItems(d?.items ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">{t.profile.ratingsTitle}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t.profile.ratingsHint}</p>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.auth.loading}</p>
      ) : !items?.length ? (
        <p className="mt-3 rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {t.profile.ratingsEmpty}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((row) => {
            const matchHref = row.eventSlug
              ? `/events/${row.eventSlug}/${encodeURIComponent(row.athleteId)}`
              : undefined;
            return (
              <li key={`${row.eventId}-${row.athleteId}-${row.updatedAt}`}>
                <div className="flex gap-3 rounded-xl border bg-card px-3 py-2.5">
                  <PlayerAvatar
                    athlete={{
                      name: row.athleteName,
                      shortName: row.athleteName.slice(0, 2),
                      photoUrl: row.photoUrl,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={playerHubHref(row.sport, row.athleteId)}
                          className="truncate font-medium hover:underline"
                        >
                          {row.athleteName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {[
                            t.sports[row.sport],
                            row.teamName,
                            row.eventTitle,
                            row.eventDate,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Overall value={row.overall} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <time dateTime={row.updatedAt}>
                        {formatWhen(row.updatedAt, locale)}
                      </time>
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {row.ratingMode === "overall_only"
                          ? t.profile.ratingModeOverall
                          : t.profile.ratingModeFull}
                      </span>
                      {matchHref ? (
                        <Link href={matchHref} className="text-primary hover:underline">
                          {t.profile.ratingOpenMatch}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
