"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { DimensionRadar } from "@/components/dimension-radar";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { initials } from "@/lib/reputation/initials";
import { useI18n } from "@/i18n/use-i18n";
import { dimLabel } from "@/i18n/position-dims";
import type { HonorBoardKind } from "@/lib/reputation/catalog";
import type { ReputationCard } from "@/lib/reputation/types";
import type { Sport } from "@/lib/types";

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
            {entry.subtitle}
          </p>
        </div>
        <div className="text-right">
          <Overall value={entry.overall} digits={entry.overallDigits ?? 1} />
          {entry.ratingCaption ? (
            <p className="text-[10px] font-medium leading-none text-muted-foreground">
              {entry.ratingCaption}
            </p>
          ) : null}
        </div>
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
  const { t } = useI18n();
  const [entries, setEntries] = useState<ReputationCard[] | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLLIElement>(null);

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

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !entries || limit >= entries.length) return;
    const io = new IntersectionObserver(
      ([hit]) => {
        if (!hit?.isIntersecting) return;
        setLimit((current) => Math.min(entries.length, current + PAGE));
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [entries, limit]);

  if (!entries) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.common.loadingPage}</p>;
  }
  if (entries.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">{t.rankings.empty}</p>;
  }

  const shown = entries.slice(0, limit);

  return (
    <div className="mt-4">
      <p className="text-xs leading-5 text-muted-foreground">{t.rankings.blendHint}</p>
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
        {limit < entries.length ? <li ref={sentinel} className="h-px" aria-hidden /> : null}
      </ol>
    </div>
  );
}
