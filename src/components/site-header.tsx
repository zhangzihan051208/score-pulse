"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthMenu } from "@/components/auth-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import { SPORTS } from "@/lib/types";
import { VIP_BILLING_ENABLED } from "@/lib/vip";
import { cn } from "cn";

function NavLink({
  href,
  label,
  active,
  className,
  prefetch,
  "data-active": dataActive,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
  prefetch?: boolean;
  "data-active"?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      data-active={dataActive}
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

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-1.5 sm:px-4">
          <nav className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto" aria-label={t.nav.home}>
            <NavLink href="/" label={t.nav.home} active={pathname === "/"} />
            <NavLink
              href="/profile"
              label={t.nav.profile}
              active={pathname.startsWith("/profile") && !pathname.startsWith("/profile/vip")}
            />
            {VIP_BILLING_ENABLED ? (
              <NavLink
                href="/profile/vip"
                label={t.nav.vip}
                active={pathname.startsWith("/profile/vip")}
              />
            ) : null}
            <NavLink
              href="/rankings"
              label={t.nav.rankings}
              active={pathname.startsWith("/rankings")}
            />
            <NavLink
              href="/zones"
              label={t.nav.zones}
              active={pathname.startsWith("/zones")}
            />
          </nav>
          <form
            className="w-full min-w-[7.5rem] max-w-[14rem] shrink-0 sm:max-w-xs"
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

        <SportStrip pathname={pathname} />
      </div>
    </header>
  );
}

function SportStrip({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const scroller = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = scroller.current;
    const active = root?.querySelector<HTMLElement>("[data-active='true']");
    if (!root || !active) return;
    const left = active.offsetLeft - root.clientWidth / 2 + active.clientWidth / 2;
    root.scrollTo({ left: Math.max(0, left) });
  }, [pathname]);

  function nudge(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-1 px-2 pb-1.5 sm:px-3">
      <button
        type="button"
        aria-label={t.nav.boards}
        onClick={() => nudge(-1)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
      >
        ‹
      </button>
      <nav
        ref={scroller}
        aria-label={t.nav.boards}
        className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto pb-1 [scrollbar-color:rgba(255,255,255,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-track]:bg-white/10"
      >
        {SPORTS.map((sport) => {
          const href = `/boards/${sport}`;
          const active = pathname.startsWith(href);
          return (
            <NavLink
              key={sport}
              href={href}
              label={t.sports[sport]}
              active={active}
              prefetch={false}
              data-active={active ? "true" : undefined}
            />
          );
        })}
      </nav>
      <button
        type="button"
        aria-label={t.nav.boards}
        onClick={() => nudge(1)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
      >
        ›
      </button>
    </div>
  );
}
