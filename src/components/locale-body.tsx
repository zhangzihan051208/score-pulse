"use client";

import { useI18n } from "@/i18n/use-i18n";

/** Remount page content when locale changes so all client copy updates together. */
export function LocaleBody({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return <div key={locale}>{children}</div>;
}
