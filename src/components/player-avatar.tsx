"use client";

import { cn } from "cn";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Athlete } from "@/lib/types";

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
  const sizeClass =
    size === "lg"
      ? "size-16 sm:size-20"
      : size === "sm"
        ? "size-10"
        : "size-12";

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
        className={cn(sizeClass, "rounded-xl after:rounded-xl")}
      >
        {athlete.photoUrl ? (
          <AvatarImage
            src={athlete.photoUrl}
            alt={athlete.name}
            className="rounded-xl object-cover object-top"
          />
        ) : null}
        <AvatarFallback className="rounded-xl bg-[#141414] text-sm font-semibold text-white">
          {athlete.shortName}
        </AvatarFallback>
      </Avatar>
      {showJerseyBadge && jersey ? (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex min-w-[1.35rem] items-center justify-center rounded-md bg-primary px-1 py-0.5 text-[10px] font-bold tabular-nums text-primary-foreground ring-2 ring-background",
            size === "lg" && "text-xs",
          )}
        >
          {jersey}
        </span>
      ) : null}
    </div>
  );
}
