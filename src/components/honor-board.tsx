"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { initials } from "@/lib/reputation/initials";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel, positionRoleLabel } from "@/i18n/position-dims";
import type { HonorBoardKind } from "@/lib/reputation/catalog";
import type { ReputationCard } from "@/lib/reputation/types";
import type { PositionKey } from "@/lib/position-ratings";
import { POSITION_PROFILES } from "@/lib/position-ratings";
import type { Sport } from "@/lib/types";
import { cn } from "cn";

const PAGE = 24;
const CHART = 148;

const listeners = new Map<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function watchNearView(el: Element, onVisible: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    onVisible();
    return () => {};
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (!entry.isIntersecting) continue;
          const notify = listeners.get(entry.target);
          if (!notify) continue;
          listeners.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
          notify();
        }
      },
      { rootMargin: "480px 0px" },
    );
  }
  listeners.set(el, onVisible);
  sharedObserver.observe(el);
  return () => {
    listeners.delete(el);
    sharedObserver?.unobserve(el);
  };
}

function NearView({
  children,
  minHeight,
  eager,
}: {
  children: ReactNode;
  minHeight: number;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(Boolean(eager));

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    return watchNearView(el, () => setShow(true));
  }, [show]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}

const HonorCard = memo(function HonorCard({
  entry,
  showSport,
  prefixSport,
  eagerChart,
}: {
  entry: ReputationCard;
  showSport: boolean;
  prefixSport: boolean;
  eagerChart: boolean;
}) {
  const { locale, t } = useI18n();
  const labels = entry.dimIds.map((id) =>
    entry.positionKey
      ? dimLabel(locale, entry.positionKey, id)
      : (t.dims[entry.sport]?.[id] ?? id),
  );
  const honor = locale === "zh" ? entry.honors.zh : entry.honors.en;
  const sportName = t.sports[entry.sport];
  const roleName = entry.positionKey ? positionRoleLabel(locale, entry.positionKey) : "";
  const avatar = (
    <PlayerAvatar
      athlete={{
        name: entry.name,
        shortName: initials(entry.name),
        photoUrl: entry.photoUrl,
        jerseyNumber: entry.kitNumber,
      }}
      size="sm"
      showJerseyBadge={Boolean(entry.kitNumber)}
    />
  );

  return (
    <li className="rounded-lg border p-3">
      {showSport ? (
        <p className="mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {sportName}
        </p>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="w-7 shrink-0 pt-1.5 text-center text-sm font-bold text-muted-foreground">
          {entry.rank}
        </span>
        {entry.href ? (
          <Link href={entry.href} className="shrink-0">
            {avatar}
          </Link>
        ) : (
          avatar
        )}
        <div className="min-w-0 flex-1">
          {entry.href ? (
            <Link href={entry.href} className="truncate font-medium hover:underline">
              {entry.name}
            </Link>
          ) : (
            <p className="truncate font-medium">{entry.name}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {prefixSport ? `${sportName} · ` : ""}
            {roleName ? `${roleName} · ` : ""}
            {entry.subtitle}
          </p>
        </div>
        <Overall value={entry.overall} digits={entry.overallDigits ?? 1} />
      </div>
      <p className="mt-2 text-sm leading-6">{honor}</p>
      <div className="mt-2 grid grid-cols-[148px_minmax(0,1fr)] items-center gap-2">
        <NearView minHeight={CHART} eager={eagerChart}>
          <DimensionRadar
            dimIds={entry.dimIds}
            dimLabels={labels}
            size={CHART}
            showLabels={false}
            series={[
              {
                label: entry.name,
                scores: entry.scores,
                stroke: "oklch(0.58 0.19 38)",
                fill: "oklch(0.58 0.19 38 / 0.22)",
              },
            ]}
          />
        </NearView>
        <ul className="min-w-0 space-y-1.5">
          {entry.dimIds.map((id, axis) => (
            <li key={id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-muted-foreground">{labels[axis]}</span>
              <span className="font-semibold tabular-nums">
                {(entry.scores[id] ?? 0).toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
});

export function HonorBoard({
  kind,
  sport,
}: {
  kind: HonorBoardKind;
  sport: Sport | "all";
}) {
  const { locale, t } = useI18n();
  const [entries, setEntries] = useState<ReputationCard[] | null>(null);
  const [role, setRole] = useState<PositionKey | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLLIElement>(null);

  useEffect(() => {
    setRole("all");
  }, [kind, sport]);

  useEffect(() => {
    const sp = new URLSearchParams({ kind });
    if (sport !== "all") sp.set("sport", sport);
    let cancelled = false;
    fetch(`/api/honor?${sp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entries?: ReputationCard[] } | null) => {
        if (!cancelled) {
          setEntries(d?.entries ?? []);
          setLimit(PAGE);
        }
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, sport]);

  const roles = useMemo(() => {
    const present = new Set(entries?.map((entry) => entry.positionKey).filter(Boolean));
    return (Object.keys(POSITION_PROFILES) as PositionKey[]).filter(
      (key) => present.has(key) && (sport === "all" || POSITION_PROFILES[key].sport === sport),
    );
  }, [entries, sport]);

  const ranked = useMemo(() => {
    if (!entries) return [];
    const soccerRole = role !== "all" && role.startsWith("soccer.");
    const list =
      role === "all"
        ? entries.filter((entry) => !entry.offBoard)
        : entries
            .filter((entry) => entry.positionKey === role && (!soccerRole || entry.roleOrder))
            .sort((a, b) => (a.roleOrder ?? 999) - (b.roleOrder ?? 999) || a.rank - b.rank);
    const shown = soccerRole ? list.slice(0, 20) : list;
    return shown.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [entries, role]);

  useEffect(() => {
    setLimit(PAGE);
  }, [role]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || limit >= ranked.length) return;
    const io = new IntersectionObserver(
      ([hit]) => {
        if (!hit?.isIntersecting) return;
        setLimit((current) => Math.min(ranked.length, current + PAGE));
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ranked.length, limit]);

  if (!entries) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.common.loadingPage}</p>;
  }
  if (entries.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.rankings.empty}</p>;
  }

  const shown = ranked.slice(0, limit);
  const showRoles = sport !== "all" && kind !== "teams" && roles.length > 1;

  return (
    <div className="mt-4">
      {showRoles ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRole("all")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              role === "all" ? "bg-foreground text-background" : "bg-muted",
            )}
          >
            {t.rankings.roleAll}
          </button>
          {roles.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                role === key ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {positionRoleLabel(locale, key)}
            </button>
          ))}
        </div>
      ) : null}
      <p className={cn("text-xs leading-5 text-muted-foreground", showRoles && "mt-3")}>
        {t.rankings.blendHint}
      </p>
      {ranked.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.rankings.empty}</p>
      ) : (
      <ol className="mt-3 space-y-3">
        {shown.map((entry, index) => {
          const showSport =
            sport === "all" && (index === 0 || shown[index - 1]?.sport !== entry.sport);
          return (
            <HonorCard
              key={`${entry.sport}:${entry.id}`}
              entry={entry}
              showSport={showSport}
              prefixSport={sport === "all"}
              eagerChart={index < 6}
            />
          );
        })}
        {limit < ranked.length ? <li ref={sentinel} className="h-px" aria-hidden /> : null}
      </ol>
      )}
    </div>
  );
}
