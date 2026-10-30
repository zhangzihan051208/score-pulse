"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GradeSlider } from "@/components/grade-slider";
import { CommentBody } from "@/components/comment-body";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/use-i18n";
import { meanScore } from "@/lib/score-display";
import { moderationMessage } from "@/lib/moderation-message";
import type { Locale, ScoreMap } from "@/lib/types";

type Payload = {
  zone: {
    slug: string;
    title: string;
    isOwner?: boolean;
    dimensions: { id: string; label: string }[];
  };
  item: { id: string; name: string; photo_url?: string | null; blurb?: string | null };
  communityAvg: ScoreMap | null;
  ratingCount: number;
  mine: ScoreMap | null;
  comments: {
    id: string;
    author: string;
    body: string;
    bodyOriginal?: string;
    bodyLocale?: Locale;
    isTranslated?: boolean;
    createdAt: string;
    pending?: boolean;
    isYou?: boolean;
  }[];
};

export function ZoneItemPageInner({
  slug,
  itemId,
}: {
  slug: string;
  itemId: string;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/zones/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => {
        setData(d);
        if (d?.mine) setScores(d.mine);
        else if (d?.zone.dimensions) {
          const init: ScoreMap = {};
          for (const dim of d.zone.dimensions) init[dim.id] = 7;
          setScores(init);
        }
      });
  }, [itemId, slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <p className="mx-auto max-w-lg px-3 py-10 text-sm text-muted-foreground">
        {t.common.loadingPage}
      </p>
    );
  }

  const { zone, item, communityAvg, ratingCount, comments } = data;
  const dims = zone.dimensions;

  return (
    <div className="mx-auto max-w-lg px-3 py-8 pb-24">
      <Link
        href={`/zones/${slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {zone.title}
      </Link>

      <div className="mt-4 flex gap-4">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo_url}
            alt=""
            className="size-24 rounded-2xl object-cover shadow-md"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-2xl bg-muted text-2xl font-bold">
            {item.name.slice(0, 1)}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold">{item.name}</h1>
          {item.blurb ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.blurb}</p>
          ) : null}
          {communityAvg ? (
            <p className="mt-2 text-sm">
              {t.rate.community}{" "}
              <span className="font-bold tabular-nums">
                {meanScore(communityAvg).toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                ({ratingCount} {t.event.ratings})
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {user ? (
        <form
          className="mt-8 space-y-4 rounded-2xl border bg-card p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const rateRes = await fetch(
              `/api/zones/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/rate`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scores }),
              },
            );
            if (!rateRes.ok) {
              const j = (await rateRes.json()) as { error?: string };
              setError(j.error ?? t.auth.failed);
              return;
            }
            if (comment.trim().length >= 8) {
              const cRes = await fetch(
                `/api/zones/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/comment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ comment, scores }),
                },
              );
              const cj = (await cRes.json()) as {
                error?: string;
                code?: string;
                messageKey?: string;
              };
              if (!cRes.ok) {
                setError(
                  cj.code === "moderation_blocked"
                    ? moderationMessage(t.moderation, cj.messageKey)
                    : (cj.error ?? t.auth.failed),
                );
              }
            }
            load();
          }}
        >
          <h2 className="text-sm font-semibold">{t.zones.rateItem}</h2>
          {dims.map((d) => (
            <GradeSlider
              key={d.id}
              label={d.label}
              value={scores[d.id] ?? 7}
              onChange={(v) => setScores((s) => ({ ...s, [d.id]: v }))}
            />
          ))}
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.rate.commentHint}
            rows={3}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            {t.rate.post}
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{t.zones.signInToRate}</p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold">{t.rate.takes}</h2>
        <ul className="mt-3 space-y-2">
          {comments.length === 0 ? (
            <li className="text-sm text-muted-foreground">{t.rate.noComments}</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">
                  {c.author}
                  {c.pending ? (
                    <span className="ml-2 text-xs text-amber-600">{t.zones.pending}</span>
                  ) : null}
                </p>
                <CommentBody
                  className="mt-1"
                  body={c.body}
                  bodyOriginal={c.bodyOriginal}
                  bodyLocale={c.bodyLocale}
                  isTranslated={c.isTranslated}
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
