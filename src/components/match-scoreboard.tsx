"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import { elapsedMatchMinutes } from "@/lib/match-clock";
import { FormPips } from "@/components/form-pips";
import { TeamCrest } from "@/components/team-crest";
import { useLeagueTable } from "@/hooks/use-league-table";
import { findStanding } from "@/lib/league-table";
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
  const name = side === "home" ? event.homeTeamName : event.awayTeamName;
  if (!id) return null;
  const sport = event.sport === "nba" || event.sport === "soccer" ? event.sport : "soccer";
  const params = new URLSearchParams({ sport });
  if (name) params.set("name", name);
  return `/teams/${encodeURIComponent(id)}?${params}`;
}

export function MatchScoreboard({
  event,
  size = "md",
  className,
  inverted = false,
  matchHref,
  playerCount,
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
    | "status"
    | "leagueSlug"
  >;
  size?: "sm" | "md" | "lg";
  className?: string;
  inverted?: boolean;
  /** Opens the match thread for player ratings. */
  matchHref?: string;
  /** Shown on the rate button when known. */
  playerCount?: number;
}) {
  const { t } = useI18n();
  const table = useLeagueTable(event.leagueSlug);
  const homeStanding = findStanding(table, event.homeTeamId, event.homeTeamName);
  const awayStanding = findStanding(table, event.awayTeamId, event.awayTeamName);
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

  const crestSize = size === "lg" ? "lg" : size === "sm" ? "sm" : "md";

  function TeamName({
    side,
    name,
    win,
    rank,
    form,
  }: {
    side: "home" | "away";
    name: string;
    win: boolean;
    rank?: number;
    form?: string;
  }) {
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
    const nameNode = href ? (
      <Link href={href} className="relative z-10 max-w-full hover:underline">
        {inner}
      </Link>
    ) : (
      inner
    );
    const rankNode = rank ? (
      <span className="shrink-0 tabular-nums text-[10px] font-semibold text-muted-foreground">
        #{rank}
      </span>
    ) : null;
    return (
      <div className={cn(nameClass, side === "home" ? "text-right" : "text-left")}>
        <div
          className={cn(
            "flex items-center gap-1",
            side === "home" ? "justify-end" : "justify-start",
          )}
        >
          {side === "away" ? rankNode : null}
          {nameNode}
          {side === "home" ? rankNode : null}
        </div>
        {form && size !== "sm" ? (
          <div className={cn("mt-1 flex", side === "home" ? "justify-end" : "justify-start")}>
            <FormPips form={form} inverted={inverted} />
          </div>
        ) : null}
      </div>
    );
  }

  const rateLabel =
    playerCount != null && playerCount > 0
      ? `${t.event.ratePlayer} · ${playerCount}`
      : t.event.ratePlayer;

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
        <span className="text-2xl font-bold tracking-wide text-foreground sm:text-3xl">vs</span>
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
      {matchHref && size !== "lg" ? (
        <span
          className={cn(
            buttonVariants({
              variant: inverted ? "secondary" : "default",
              size: "xs",
            }),
            "mt-2",
            inverted && "border-white/20 bg-white/15 text-white hover:bg-white/25",
          )}
        >
          {rateLabel}
        </span>
      ) : null}
    </>
  );

  function MatchLink({
    children,
    className: linkClass,
    label,
  }: {
    children: ReactNode;
    className?: string;
    label?: string;
  }) {
    if (!matchHref) return <div className={linkClass}>{children}</div>;
    return (
      <Link href={matchHref} aria-label={label} className={cn("rounded-md outline-none", linkClass)}>
        {children}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        inverted && "text-white [&_.text-muted-foreground]:text-white/65",
        className,
      )}
    >
      <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <MatchLink className="flex justify-end">
          <TeamCrest name={home} badgeUrl={event.homeTeamLogoUrl} size={crestSize} />
        </MatchLink>
        <div aria-hidden className="min-w-[5.5rem]" />
        <MatchLink className="flex justify-start">
          <TeamCrest name={away} badgeUrl={event.awayTeamLogoUrl} size={crestSize} />
        </MatchLink>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <TeamName side="home" name={home} win={homeWin} rank={homeStanding?.rank} form={homeStanding?.form} />
        </div>
        <MatchLink className="flex min-w-[5.5rem] flex-col items-center" label={rateLabel}>
          {scoreBlock}
        </MatchLink>
        <div className="text-left">
          <TeamName side="away" name={away} win={awayWin} rank={awayStanding?.rank} form={awayStanding?.form} />
        </div>
        {matchHref && size === "lg" ? (
          <div className="col-span-3 flex justify-center pt-2">
            <Link
              href={matchHref}
              className={cn(
                buttonVariants({
                  variant: inverted ? "secondary" : "default",
                  size: "sm",
                }),
                inverted && "border-white/20 bg-white/15 text-white hover:bg-white/25",
              )}
            >
              {rateLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
