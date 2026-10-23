import { slugify } from "@/lib/slugify";

export const ZONE_CATEGORIES = [
  "food",
  "drink",
  "snack",
  "restaurant",
  "product",
  "custom",
] as const;

export type ZoneCategory = (typeof ZONE_CATEGORIES)[number];

export type ZoneDimensionDef = {
  id: string;
  label: string;
};

export type RatingZoneRow = {
  id: string;
  slug: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string;
  dimensions: ZoneDimensionDef[];
  heat_score: number;
  item_count: number;
  rating_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ZoneItemRow = {
  id: string;
  zone_id: string;
  name: string;
  photo_url: string | null;
  blurb: string | null;
  heat_score: number;
  rating_count: number;
  created_by: string | null;
  hidden: boolean;
  created_at: string;
};

export const FOOD_DIMENSION_PRESET: ZoneDimensionDef[] = [
  { id: "taste", label: "Taste" },
  { id: "value", label: "Value" },
  { id: "portion", label: "Portion" },
  { id: "vibe", label: "Vibe" },
  { id: "would_retry", label: "Would buy again" },
];

export function normalizeDimensions(raw: unknown): ZoneDimensionDef[] {
  if (!Array.isArray(raw)) return FOOD_DIMENSION_PRESET;
  const out: ZoneDimensionDef[] = [];
  for (const row of raw.slice(0, 5)) {
    if (typeof row === "string" && row.trim()) {
      const id = slugify(row).slice(0, 32) || `d${out.length}`;
      out.push({ id, label: row.trim().slice(0, 24) });
    } else if (row && typeof row === "object") {
      const o = row as { id?: string; label?: string };
      const label = o.label?.trim() || o.id?.trim() || "";
      if (!label) continue;
      const id = slugify(o.id || label).slice(0, 32) || `d${out.length}`;
      out.push({ id, label: label.slice(0, 24) });
    }
  }
  return out.length >= 3 ? out.slice(0, 5) : FOOD_DIMENSION_PRESET;
}

export function uniqueZoneSlug(title: string, suffix?: string) {
  const base = slugify(title).slice(0, 40) || "zone";
  return suffix ? `${base}-${suffix}`.slice(0, 60) : base;
}

