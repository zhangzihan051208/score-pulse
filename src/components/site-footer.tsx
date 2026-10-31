"use client";

import Link from "next/link";
import { VIP_BILLING_ENABLED } from "@/lib/vip";
import { useI18n } from "@/i18n/use-i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-white/10 bg-gradient-to-b from-[#0e0e12] to-[#08080a] text-sm text-white/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-4">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-mark.jpg"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div>
            <p className="font-display text-base font-bold text-white/90">{t.brand}</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-white/50">{t.tagline}</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link href="/rankings" className="hover:text-white">
            {t.nav.rankings}
          </Link>
          <Link href="/guide" className="hover:text-white">
            {t.nav.guide}
          </Link>
          <Link href="/profile" className="hover:text-white">
            {t.nav.profile}
          </Link>
          {VIP_BILLING_ENABLED ? (
            <Link href="/profile/vip" className="hover:text-white">
              {t.nav.vip}
            </Link>
          ) : null}
          <Link href="/search" className="hover:text-white">
            {t.nav.search}
          </Link>
          <Link href="/privacy" className="hover:text-white">
            {t.nav.privacy}
          </Link>
          <Link href="/safety" className="hover:text-white">
            {t.safety.title}
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/8 px-3 py-4 text-center text-[11px] text-white/40 sm:px-4">
        {t.footer}
      </div>
    </footer>
  );
}
