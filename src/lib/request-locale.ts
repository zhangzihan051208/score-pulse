import { LOCALES, type Locale } from "@/lib/types";

function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (LOCALES as readonly string[]).includes(value));
}

/** Viewer language from ?locale= or sideline-locale cookie. */
export function localeFromRequest(request: Request): Locale {
  const { searchParams } = new URL(request.url);
  const fromQuery = searchParams.get("locale");
  if (isLocale(fromQuery)) return fromQuery;

  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)sideline-locale=([^;]+)/);
  if (isLocale(match?.[1])) return match![1] as Locale;

  return "en";
}
