"use client";

import { cn } from "cn";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Athlete } from "@/lib/types";

/** Outer box — Avatar inside must use !size-full (ui/Avatar forces size-8 / size-10). */
const FRAME = {
  sm: "size-12",
  default: "size-16",
  lg: "size-20 sm:size-24",
  /** Player detail / post header */
  xl: "size-[5.5rem] sm:size-28",
} as const;

const FALLBACK_TEXT = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base sm:text-lg",
  xl: "text-lg sm:text-xl",
} as const;

export function PlayerAvatar({
  athlete,
  size = "lg",
  className,
  showJerseyBadge = true,
}: {
  athlete: Pick<Athlete, "shortName" | "photoUrl" | "jerseyNumber" | "name">;
  size?: "sm" | "default" | "lg" | "xl";
  className?: string;
  showJerseyBadge?: boolean;
}) {
  const jersey = athlete.jerseyNumber?.replace(/^#/, "");

  return (
    <div className={cn("relative shrink-0", FRAME[size], className)}>
      <Avatar
        className={cn(
          "!size-full max-h-none max-w-none rounded-2xl after:rounded-2xl",
        )}
      >
        {athlete.photoUrl ? (
          <AvatarImage
            src={athlete.photoUrl}
            alt={athlete.name}
            className="size-full rounded-2xl object-cover object-top"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "rounded-2xl bg-[#141414] font-semibold text-white",
            FALLBACK_TEXT[size],
          )}
        >
          {athlete.shortName}
        </AvatarFallback>
      </Avatar>
      {showJerseyBadge && jersey ? (
        <span
          className={cn(
            "pointer-events-none absolute z-10 flex items-center justify-center rounded-md bg-primary font-bold tabular-nums text-primary-foreground shadow-md ring-2 ring-background",
            "bottom-0.5 right-0.5 min-h-[1.15rem] min-w-[1.15rem] translate-x-1/4 translate-y-1/4 px-0.5 text-[10px] leading-none",
            size === "default" &&
              "bottom-1 right-1 min-h-[1.25rem] min-w-[1.25rem] px-1 text-[11px]",
            (size === "lg" || size === "xl") &&
              "bottom-1.5 right-1.5 min-h-[1.35rem] min-w-[1.35rem] px-1 text-xs sm:min-h-6 sm:min-w-6 sm:text-sm",
            size === "xl" && "sm:bottom-2 sm:right-2",
            size === "sm" &&
              "bottom-0 right-0 min-h-[1rem] min-w-[1rem] text-[9px]",
          )}
        >
          {jersey}
        </span>
      ) : null}
    </div>
  );
}
