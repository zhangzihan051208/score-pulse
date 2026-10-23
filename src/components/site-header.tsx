"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthMenu } from "@/components/auth-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import { SPORTS } from "@/lib/types";
import { cn } from "cn";

function NavLink({
  href,
  label,
  active,
  className,
  prefetch,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/12 text-white",
        className,
      )}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [searchQ, setSearchQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-b from-[#0a0a0d] to-[#121218] text-white shadow-md shadow-black/25 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-mark.jpg"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg object-cover shadow-sm ring-1 ring-white/15"
          />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            {t.brand}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/guide"
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:text-sm",
              pathname.startsWith("/guide") && "bg-white/12 text-white",
            )}
          >
            {t.nav.guide}
          </Link>
          <AuthMenu />
          <LocaleSwitcher />
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-2 border-t border-white/8 px-3 py-2 sm:px-4">
        <nav
          className="flex min-w-0 shrink gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t.nav.boards}
        >
          <NavLink href="/" label={t.nav.home} active={pathname === "/"} className="text-xs" />
          <NavLink
            href="/profile"
            label={t.nav.profile}
            active={pathname.startsWith("/profile")}
            className="text-xs sm:text-sm"
          />
          <NavLink
            href="/rankings"
            label={t.nav.rankings}
            active={pathname.startsWith("/rankings")}
            className="text-xs sm:text-sm"
          />
          <NavLink
            href="/zones"
            label={t.nav.zones}
            active={pathname.startsWith("/zones")}
            className="text-xs sm:text-sm"
          />
          {SPORTS.map((sport) => {
            const href = `/boards/${sport}`;
            return (
              <NavLink
                key={sport}
                href={href}
                label={t.sports[sport]}
                active={pathname.startsWith(href)}
                className="text-xs sm:text-sm"
                prefetch={false}
              />
            );
          })}
        </nav>

        <form
          className="ml-auto w-full min-w-[8rem] max-w-[14rem] shrink-0 sm:max-w-xs"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const term = searchQ.trim();
            window.dispatchEvent(new Event("sideline:navstart"));
            if (term.length < 1) {
              router.push("/search");
              return;
            }
            router.push(`/search?q=${encodeURIComponent(term)}`);
          }}
        >
          <Input
            type="search"
            name="q"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t.search.placeholder}
            aria-label={t.nav.search}
            className="h-8 border-white/15 bg-white/10 text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
          />
        </form>
      </div>
    </header>
  );
}
