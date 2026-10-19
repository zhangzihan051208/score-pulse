"use client";

import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "cn";

export type LoadingMessage = "page" | "search" | "teamSearch";

function loadingCopy(t: ReturnType<typeof useI18n>["t"], message: LoadingMessage) {
  switch (message) {
    case "search":
      return t.common.loadingSearch;
    case "teamSearch":
      return t.common.loadingTeamSearch;
    default:
      return t.common.loadingPage;
  }
}

export function LoadingView({
  message = "page",
  variant = "page",
  className,
}: {
  message?: LoadingMessage;
  variant?: "page" | "section" | "inline";
  className?: string;
}) {
  const { t } = useI18n();
  const label = loadingCopy(t, message);

  if (variant === "inline") {
    return (
      <div
        className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
        <span>{label}</span>
      </div>
    );
  }

  const isPage = variant === "page";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        isPage ? "min-h-[min(420px,55vh)] px-4 py-16" : "rounded-xl border border-dashed px-4 py-12",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={cn("animate-spin text-primary", isPage ? "size-9" : "size-7")}
        aria-hidden
      />
      <p className={cn("text-muted-foreground", isPage ? "text-sm" : "text-xs")}>{label}</p>
    </div>
  );
}
