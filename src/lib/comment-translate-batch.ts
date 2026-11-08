import { createHash } from "node:crypto";

export function translationBodyHash(body: string) {
  return createHash("sha256").update(body.trim()).digest("hex");
}

/** Model output is JSON `{"items":[...]}` with one string per input comment. */
export function parseTranslationBatch(raw: string, count: number): (string | null)[] | null {
  const trimmed = raw.trim();
  if (!trimmed || count <= 0) return null;
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return null;
  }
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : null;
  if (!items || items.length !== count) return null;
  return items.map((item) => {
    if (typeof item !== "string") return null;
    const text = item.trim();
    return text || null;
  });
}
