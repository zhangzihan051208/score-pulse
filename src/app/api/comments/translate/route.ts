import { translateBodies } from "@/lib/comment-translate";
import { viewerLocaleFromRequest } from "@/lib/viewer-locale";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let payload: { texts?: unknown };
  try {
    payload = (await request.json()) as { texts?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const texts = Array.isArray(payload.texts)
    ? payload.texts.filter((item): item is string => typeof item === "string").slice(0, 24)
    : [];
  if (texts.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const locale = viewerLocaleFromRequest(request);
  const trimmed = texts.map((text) => text.slice(0, 2000));
  const translated = await translateBodies(trimmed, locale);
  return NextResponse.json({
    items: trimmed.map((text, index) => {
      const next = translated[index];
      const changed = Boolean(next && next !== text);
      return {
        text: changed ? next : text,
        original: changed ? text : null,
      };
    }),
  });
}
