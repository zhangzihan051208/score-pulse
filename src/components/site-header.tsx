"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/i18n/use-i18n";
import { SPORTS } from "@/lib/types";
import { cn } from "cn";

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-[#141414] text-white">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="min-w-0 shrink-0">
            <span className="block text-base font-bold tracking-tight leading-none">
              {t.brand}
            </span>
            <span className="hidden max-w-[14rem] truncate text-[10px] font-normal text-white/55 sm:block">
              {t.tagline}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
            {SPORTS.map((sport) => {
              const href = `/boards/${sport}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={sport}
                  href={href}
                  className={cn(
                    "rounded px-2 py-1 text-sm text-white/75 hover:bg-white/10 hover:text-white",
                    active && "bg-white/15 text-white",
                  )}
                >
                  {t.sports[sport]}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className={cn(
              "hidden text-sm text-white/75 hover:text-white sm:inline",
              pathname.startsWith("/feed") && "text-white",
            )}
          >
            {t.nav.feed}
          </Link>
          <Link
            href="/guide"
            className={cn(
              "hidden text-sm text-white/75 hover:text-white sm:inline",
              pathname.startsWith("/guide") && "text-white",
            )}
          >
            {t.nav.guide}
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-2 py-1 md:hidden">
        {SPORTS.map((sport) => (
          <Link
            key={sport}
            href={`/boards/${sport}`}
            className={cn(
              "shrink-0 rounded px-2 py-1 text-xs text-white/75",
              pathname.startsWith(`/boards/${sport}`) && "bg-white/15 text-white",
            )}
          >
            {t.sports[sport]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
