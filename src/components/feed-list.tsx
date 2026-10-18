"use client";

import Link from "next/link";
import { useCommunity } from "@/hooks/use-community";
import { useI18n } from "@/i18n/use-i18n";
import { tx } from "@/lib/copy";
import { athletes, events, formatWhen, getPerformance, overallScore } from "@/lib/data";
import { allFeedItems } from "@/lib/store";
import type { Localized } from "@/lib/types";

export function FeedList() {
  const { locale, t } = useI18n();
  const { state } = useCommunity();
  const items = allFeedItems(state);

  return (
    <div className="mx-auto max-w-xl px-3 py-8">
      <h1 className="text-2xl font-bold">{t.feed.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.feed.lead}</p>
      <ul className="mt-6 space-y-2">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            {t.feed.empty}
          </li>
        ) : (
          items.map((item, index) => {
            const event = events.find((e) => e.id === item.eventId);
            const athlete = athletes[item.athleteId];
            if (!event || !athlete) return null;
            const body =
              "body" in item && item.body
                ? typeof item.body === "string"
                  ? item.body
                  : tx(item.body as Localized, locale)
                : null;
            return (
              <li key={`${item.kind}-${"id" in item ? item.id : index}`}>
                <Link
                  href={`/events/${event.slug}/${athlete.id}`}
                  className="block rounded-xl border bg-card px-3 py-3 hover:bg-muted/40"
                >
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {item.kind === "comment" ? t.feed.comment : t.feed.rating} · {item.author}
                    </span>
                    <time>{formatWhen(item.at, locale)}</time>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {athlete.name}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {t.sports[event.sport]} · {tx(event.title, locale)}
                    </span>
                  </p>
                  {body ? (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{body}</p>
                  ) : "scores" in item && item.scores ? (
                    <p className="mt-1 text-sm text-primary">
                      {(() => {
                        const perf = getPerformance(event, item.athleteId);
                        return perf
                          ? overallScore(item.scores, perf.positionKey).toFixed(1)
                          : "—";
                      })()}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
