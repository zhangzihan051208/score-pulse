import { LOCALES, type Locale } from "@/lib/types";

/** Viewer language for comment translation (query param wins, then Accept-Language). */
export function viewerLocaleFromRequest(request: Request): Locale {
  const q = new URL(request.url).searchParams.get("locale")?.trim().toLowerCase();
  if (q && (LOCALES as readonly string[]).includes(q)) return q as Locale;

  const accept = request.headers.get("accept-language");
  if (accept) {
    for (const part of accept.split(",")) {
      const code = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
      if (code && (LOCALES as readonly string[]).includes(code)) {
        return code as Locale;
      }
    }
  }
  return "en";
}
