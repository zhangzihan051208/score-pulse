"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/use-i18n";
import { FOOD_DIMENSION_PRESET, ZONE_CATEGORIES } from "@/lib/zones";

export function ZoneCreatePageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [category, setCategory] = useState<string>("food");
  const [dims, setDims] = useState(
    FOOD_DIMENSION_PRESET.map((d) => d.label).join("\n"),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-lg px-3 py-8 pb-24">
      <Link href="/zones" className="text-xs text-muted-foreground hover:underline">
        ← {t.zones.title}
      </Link>
      <h1 className="font-display mt-3 text-2xl font-bold">{t.zones.createTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.zones.createLead}</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const dimensionLabels = dims
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const res = await fetch("/api/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              coverUrl,
              category,
              dimensions: dimensionLabels,
            }),
          });
          const data = (await res.json()) as { error?: string; zone?: { slug: string } };
          setSaving(false);
          if (!res.ok) {
            setError(data.error ?? t.auth.failed);
            return;
          }
          router.push(`/zones/${data.zone!.slug}`);
        }}
      >
        <div>
          <label className="text-sm font-medium">{t.zones.fieldTitle}</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.zones.fieldTitlePh}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t.zones.fieldCategory}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {ZONE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.zones.categories[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t.zones.fieldDims}</label>
          <Textarea
            value={dims}
            onChange={(e) => setDims(e.target.value)}
            rows={5}
            className="mt-1 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t.zones.fieldDimsHint}</p>
        </div>
        <div>
          <label className="text-sm font-medium">{t.zones.fieldCover}</label>
          <Input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t.zones.fieldDesc}</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={saving}>
          {t.zones.publish}
        </Button>
      </form>
    </div>
  );
}
