"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { cn } from "cn";

const links = [
  { href: "/", label: "赛程" },
  { href: "/feed", label: "社区动态" },
  { href: "/playbook", label: "立项手册" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1f18]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400 text-[#0d1f18]">
            <Trophy className="size-4" />
          </span>
          <span>
            赛评台
            <span className="ml-2 hidden text-xs font-normal text-white/60 sm:inline">
              给表现打分，而不是只看胜负
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-white/75 transition hover:bg-white/10 hover:text-white",
                  active && "bg-white/15 text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
