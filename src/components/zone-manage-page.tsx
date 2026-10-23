"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";

type PendingRow = {
  id: string;
  author: string;
  body: string;
  created_at: string;
  zone_item_id: string;
};

export function ZoneManagePageInner({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/zones/${encodeURIComponent(slug)}/moderation`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pending?: PendingRow[]; zone?: { title: string } } | null) => {
        setPending(d?.pending ?? []);
        if (d?.zone?.title) setTitle(d.zone.title);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  async function moderate(commentId: string, action: "approve" | "reject") {
    await fetch(`/api/comments/${commentId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-8 pb-24">
      <Link
        href={`/zones/${slug}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {title || slug}
      </Link>
      <h1 className="font-display mt-3 text-2xl font-bold">{t.zones.moderationTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.zones.moderationLead}</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.common.loadingPage}</p>
      ) : pending.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t.zones.moderationEmpty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pending.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium">{c.author}</p>
              <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => moderate(c.id, "approve")}>
                  {t.zones.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moderate(c.id, "reject")}
                >
                  {t.zones.reject}
                </Button>
                <Link
                  href={`/zones/${slug}/items/${c.zone_item_id}`}
                  className="ml-auto self-center text-xs text-primary hover:underline"
                >
                  {t.zones.viewItem}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
