"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { elapsedMatchMinutes } from "@/lib/match-clock";
import { cn } from "cn";
import type { MatchEvent } from "@/lib/types";

function LiveClock({ startAt, detail }: { startAt?: string; detail?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  const period = detail?.trim();
  const useful =
    period && !/not started|^ns$|scheduled/i.test(period) ? period : null;
  const mins = startAt ? elapsedMatchMinutes(startAt, now) : null;
  const label = useful ?? (mins != null ? `${mins}′` : null);
  if (!label) return null;
  return <span className="tabular-nums text-primary">{label}</span>;
}

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
  matchHref,
}: {
  event: Pick<
    MatchEvent,
    | "homeTeamName"
    | "awayTeamName"
    | "homeTeamLogoUrl"
    | "awayTeamLogoUrl"
    | "homeScore"
    | "awayScore"
    | "status"
    | "statusDetail"
    | "startAt"
    | "homeTeamId"
    | "awayTeamId"
    | "sport"
    | "live"
  >;
  size?: "sm" | "md" | "lg";
  className?: string;
  inverted?: boolean;
  /** Match thread. Score block links here; team names stay separate. */
  matchHref?: string;
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
    const logoUrl =
      side === "home" ? event.homeTeamLogoUrl : event.awayTeamLogoUrl;
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
    const logo =
      logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-sm object-contain"
        />
      ) : null;
    const row = (
      <div
        className={cn(
          "flex items-center gap-2",
          side === "home" ? "justify-end" : "justify-start",
        )}
      >
        {side === "home" ? (
          <>
            {inner}
            {logo}
          </>
        ) : (
          <>
            {logo}
            {inner}
          </>
        )}
      </div>
    );
    return (
      <div className={cn("flex flex-col gap-1", side === "home" ? "items-end" : "items-start")}>
        <div className={nameClass}>{row}</div>
        {href ? (
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
              inverted
                ? "border-white/25 text-white/80 hover:bg-white/10"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {t.search.clubPage}
          </Link>
        ) : null}
      </div>
    );
  }

  const scoreBlock = (
    <>
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
      {live ? (
        <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          {t.status.live}
          <LiveClock startAt={event.startAt} detail={event.statusDetail} />
        </span>
      ) : event.statusDetail && size !== "sm" ? (
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {event.statusDetail}
        </span>
      ) : null}
      {matchHref ? (
        <span className="mt-1 text-[10px] font-semibold tracking-wide text-primary">
          {t.team.openMatch}
        </span>
      ) : null}
    </>
  );

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
        {matchHref ? (
          <Link
            href={matchHref}
            className={cn(
              "flex flex-col items-center rounded-lg border px-3 py-1.5 text-center transition-colors",
              inverted
                ? "border-white/30 bg-white/10 hover:bg-white/15"
                : "border-primary/35 bg-primary/10 hover:bg-primary/15",
            )}
          >
            {scoreBlock}
          </Link>
        ) : (
          <div className="flex flex-col items-center">{scoreBlock}</div>
        )}
      </div>
      <div className="text-left">
        <TeamName side="away" name={away} win={awayWin} />
      </div>
    </div>
  );
}
