"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthMenu } from "@/components/auth-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/i18n/use-i18n";
import { SPORTS } from "@/lib/types";
import { cn } from "cn";

const UTILITY_LINKS = [
  { href: "/search", key: "search" as const },
  { href: "/feed", key: "feed" as const },
  { href: "/guide", key: "guide" as const },
];

function NavLink({
  href,
  label,
  active,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
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
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#141414] text-white">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-3 px-3">
        <Link href="/" className="shrink-0 text-base font-bold tracking-tight">
          {t.brand}
        </Link>
        <div className="flex items-center gap-2">
          <AuthMenu />
          <LocaleSwitcher />
        </div>
      </div>

      <nav
        className="mx-auto flex max-w-6xl gap-0.5 border-t border-white/10 px-3 py-1"
        aria-label={`${t.nav.search}, ${t.nav.feed}, ${t.nav.guide}`}
      >
        {UTILITY_LINKS.map(({ href, key }) => (
          <NavLink
            key={href}
            href={href}
            label={t.nav[key]}
            active={pathname === href || pathname.startsWith(`${href}/`)}
          />
        ))}
      </nav>

      <nav
        className="mx-auto flex max-w-6xl gap-0.5 overflow-x-auto border-t border-white/10 px-3 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t.nav.boards}
      >
        <NavLink href="/" label={t.nav.home} active={pathname === "/"} className="text-xs" />
        {SPORTS.map((sport) => {
          const href = `/boards/${sport}`;
          return (
            <NavLink
              key={sport}
              href={href}
              label={t.sports[sport]}
              active={pathname.startsWith(href)}
              className="text-xs sm:text-sm"
            />
          );
        })}
      </nav>
    </header>
  );
}
