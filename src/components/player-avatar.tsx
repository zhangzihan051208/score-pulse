"use client";

import { cn } from "cn";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Athlete } from "@/lib/types";

const SIZE = {
  sm: "size-12",
  default: "size-16",
  lg: "size-[4.75rem] sm:size-24",
} as const;

const FALLBACK_TEXT = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base sm:text-lg",
} as const;

export function PlayerAvatar({
  athlete,
  size = "lg",
  className,
  showJerseyBadge = true,
}: {
  athlete: Pick<Athlete, "shortName" | "photoUrl" | "jerseyNumber" | "name">;
  size?: "sm" | "default" | "lg";
  className?: string;
  showJerseyBadge?: boolean;
}) {
  const jersey = athlete.jerseyNumber?.replace(/^#/, "");

  return (
    <div className={cn("relative shrink-0", SIZE[size], className)}>
      <Avatar
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
        className={cn("size-full rounded-2xl after:rounded-2xl", SIZE[size])}
      >
        {athlete.photoUrl ? (
          <AvatarImage
            src={athlete.photoUrl}
            alt={athlete.name}
            className="rounded-2xl object-cover object-top"
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
            "pointer-events-none absolute z-10 flex items-center justify-center rounded-lg bg-primary font-bold tabular-nums text-primary-foreground shadow-md ring-2 ring-background",
            "bottom-0 right-0 min-h-[1.35rem] min-w-[1.35rem] translate-x-[18%] translate-y-[18%] px-1 text-[11px] leading-none",
            size === "default" &&
              "min-h-[1.5rem] min-w-[1.5rem] translate-x-[20%] translate-y-[20%] px-1.5 text-xs",
            size === "lg" &&
              "min-h-[1.75rem] min-w-[1.75rem] translate-x-[22%] translate-y-[22%] px-2 text-sm sm:min-h-8 sm:min-w-8 sm:text-base",
            size === "sm" &&
              "min-h-[1.15rem] min-w-[1.15rem] translate-x-[15%] translate-y-[15%] px-0.5 text-[10px]",
          )}
        >
          {jersey}
        </span>
      ) : null}
    </div>
  );
}
