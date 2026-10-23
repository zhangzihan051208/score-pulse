"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/use-i18n";
import type { ZoneItemRow } from "@/lib/zones";

type ZonePayload = {
  zone: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    cover_url?: string | null;
    heat_score: number;
    isOwner?: boolean;
    dimensions: { id: string; label: string }[];
  };
  items: ZoneItemRow[];
};

export function ZoneDetailPageInner({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<ZonePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetch(`/api/zones/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ZonePayload | null) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (loading) {
    return (
      <p className="mx-auto max-w-3xl px-3 py-10 text-sm text-muted-foreground">
        {t.common.loadingPage}
      </p>
    );
  }

  if (!data?.zone) {
    return (
      <p className="mx-auto max-w-3xl px-3 py-10 text-sm text-muted-foreground">
        {t.zones.notFound}
      </p>
    );
  }

  const { zone, items } = data;

  return (
    <div className="mx-auto max-w-3xl px-3 py-8 pb-24">
      <Link href="/zones" className="text-xs text-muted-foreground hover:underline">
        ← {t.zones.title}
      </Link>
      <header className="mt-4 flex gap-4">
        {zone.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={zone.cover_url}
            alt=""
            className="size-20 rounded-2xl object-cover shadow-sm"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">{zone.title}</h1>
          {zone.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{zone.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {t.zones.heat} {Number(zone.heat_score).toFixed(0)} ·{" "}
            {zone.dimensions.map((d) => d.label).join(" · ")}
          </p>
          {zone.isOwner ? (
            <Link
              href={`/zones/${slug}/manage`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              {t.zones.manage}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.zones.hotItems}
        </h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.zones.noItems}</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.map((item, idx) => (
              <li key={item.id}>
                <Link
                  href={`/zones/${slug}/items/${item.id}`}
                  className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                  {item.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo_url}
                      alt=""
                      className="size-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                      {item.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.zones.heat} {Number(item.heat_score).toFixed(0)} ·{" "}
                      {item.rating_count} {t.event.ratings}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {user ? (
        <section className="mt-8 rounded-2xl border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">{t.zones.addItem}</h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setAdding(true);
              await fetch(`/api/zones/${encodeURIComponent(slug)}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, photoUrl }),
              });
              setName("");
              setPhotoUrl("");
              setAdding(false);
              load();
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.zones.itemNamePh}
              required
            />
            <Input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder={t.zones.itemPhotoPh}
            />
            <Button type="submit" size="sm" disabled={adding}>
              {t.zones.addItemBtn}
            </Button>
          </form>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{t.zones.signInToAdd}</p>
      )}
    </div>
  );
}
