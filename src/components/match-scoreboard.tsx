"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "cn";
import type { MatchEvent } from "@/lib/types";

function teamHref(event: MatchEvent, side: "home" | "away") {
  const id = side === "home" ? event.homeTeamId : event.awayTeamId;
  if (!id || !event.live) return null;
  const sport = event.sport === "nba" || event.sport === "soccer" ? event.sport : "soccer";
  return `/teams/${id}?sport=${sport}`;
}

export function MatchScoreboard({
  event,
  size = "md",
  className,
  inverted = false,
}: {
  event: Pick<
    MatchEvent,
    | "homeTeamName"
    | "awayTeamName"
    | "homeScore"
    | "awayScore"
    | "status"
    | "statusDetail"
    | "homeTeamId"
    | "awayTeamId"
    | "sport"
    | "live"
  >;
  size?: "sm" | "md" | "lg";
  className?: string;
  inverted?: boolean;
}) {
  const { t } = useI18n();
  const home = event.homeTeamName ?? "Home";
  const away = event.awayTeamName ?? "Away";
  const hasScore = event.homeScore != null && event.awayScore != null;
  const homeWin = hasScore && (event.homeScore ?? 0) > (event.awayScore ?? 0);
  const awayWin = hasScore && (event.awayScore ?? 0) > (event.homeScore ?? 0);
  const live = event.status === "live";

  const scoreClass =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-xl"
        : "text-3xl";

  const nameClass =
    size === "lg" ? "text-base sm:text-lg" : size === "sm" ? "text-xs" : "text-sm";

  function TeamName({ side, name, win }: { side: "home" | "away"; name: string; win: boolean }) {
    const href = teamHref(event as MatchEvent, side);
    const inner = (
      <span
        className={cn(
          "line-clamp-2 font-semibold leading-tight",
          win && hasScore && event.status === "ended" && "text-primary",
        )}
      >
        {name}
      </span>
    );
    if (href) {
      return (
        <Link href={href} className={cn(nameClass, "hover:underline")}>
          {inner}
        </Link>
      );
    }
    return <div className={nameClass}>{inner}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center gap-3",
        inverted && "text-white [&_.text-muted-foreground]:text-white/65",
        className,
      )}
    >
      <div className="text-right">
        <TeamName side="home" name={home} win={homeWin} />
      </div>
      <div className="flex min-w-[5.5rem] flex-col items-center">
        {hasScore ? (
          <div
            className={cn(
              "flex items-center gap-2 font-bold tabular-nums tracking-tight",
              scoreClass,
              live && "text-primary",
            )}
          >
            <span className={homeWin ? "opacity-100" : "opacity-90"}>{event.homeScore}</span>
            <span className="text-lg font-normal text-muted-foreground">–</span>
            <span className={awayWin ? "opacity-100" : "opacity-90"}>{event.awayScore}</span>
          </div>
        ) : (
          <span className={cn("font-semibold text-muted-foreground", nameClass)}>vs</span>
        )}
        {event.statusDetail && size !== "sm" ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {event.statusDetail}
          </span>
        ) : null}
        {live ? (
          <span className="mt-1 text-[10px] font-semibold uppercase text-primary">
            {t.status.live}
          </span>
        ) : null}
      </div>
      <div className="text-left">
        <TeamName side="away" name={away} win={awayWin} />
      </div>
    </div>
  );
}
