"use client";

import { useI18n } from "@/i18n/use-i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t bg-[#141414] text-sm text-white/55">
      <div className="mx-auto max-w-6xl px-3 py-6">{t.footer}</div>
    </footer>
  );
}
