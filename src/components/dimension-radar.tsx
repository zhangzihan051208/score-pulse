"use client";

import {
  RADAR_DASHED_SCORE,
  RADAR_GRID_SCORES,
  gridRingUnit,
  matchupRadarValues,
  radarDisplayValues,
  scoreToRadarUnit,
} from "@/lib/radar-scale";
import type { ScoreMap } from "@/lib/types";

type Series = {
  label: string;
  scores: ScoreMap;
  stroke: string;
  fill: string;
};

export function DimensionRadar({
  dimIds,
  dimLabels,
  series,
  size = 240,
  showLabels = true,
  variant = "single",
}: {
  dimIds: string[];
  dimLabels: string[];
  series: Series[];
  size?: number;
  /** Vertex captions. Turn off when a full score list sits beside a small chart. */
  showLabels?: boolean;
  /** Matchup widens each axis gap before the radius curve. Labels stay on the raw scores. */
  variant?: "single" | "matchup";
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = dimIds.length;
  const frame = scoreToRadarUnit(10);
  const rings = RADAR_GRID_SCORES.map((score) => ({
    score,
    unit: gridRingUnit(score),
    dashed: score === RADAR_DASHED_SCORE,
  }));
  const radii = radiiForSeries(series, dimIds, variant);

  function point(i: number, unit: number) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (unit / 10) * maxR;
    return {
      x: round2(cx + r * Math.cos(angle)),
      y: round2(cy + r * Math.sin(angle)),
    };
  }

  function polygon(values: number[]) {
    return values
      .map((v, i) => {
        const p = point(i, v);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[260px]"
      role="img"
      aria-hidden
    >
      <polygon
        points={polygon(dimIds.map(() => frame))}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.06}
        strokeWidth={1}
      />
      {rings.map((ring) => (
        <polygon
          key={ring.score}
          points={polygon(dimIds.map(() => ring.unit))}
          fill="none"
          stroke="currentColor"
          strokeOpacity={ring.dashed ? 0.28 : 0.1}
          strokeWidth={ring.dashed ? 1.5 : 1}
          strokeDasharray={ring.dashed ? "4 3" : undefined}
        />
      ))}
      {dimIds.map((_, i) => {
        const p = point(i, frame);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        );
      })}
      {series.map((s, index) => (
        <polygon
          key={s.label}
          points={polygon(radii[index] ?? [])}
          fill={s.fill}
          stroke={s.stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      ))}
      {showLabels
        ? dimLabels.map((label, i) => {
            const p = point(i, 11.4);
            const homeRaw = series[0]?.scores[dimIds[i]!];
            const awayRaw = variant === "matchup" ? series[1]?.scores[dimIds[i]!] : undefined;
            return (
              <text
                key={`${label}-${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[9px] font-medium"
              >
                {label.length > 8 ? `${label.slice(0, 7)}…` : label}
                {homeRaw != null ? (
                  <tspan className="fill-foreground/80 font-semibold">
                    {" "}
                    {homeRaw.toFixed(1)}
                  </tspan>
                ) : null}
                {awayRaw != null ? (
                  <tspan className="fill-foreground/80 font-semibold">
                    {" / "}
                    {awayRaw.toFixed(1)}
                  </tspan>
                ) : null}
              </text>
            );
          })
        : null}
    </svg>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function radiiForSeries(
  series: Series[],
  dimIds: string[],
  variant: "single" | "matchup",
): number[][] {
  if (variant === "matchup" && series.length >= 2) {
    const paired = matchupRadarValues(series[0]!.scores, series[1]!.scores, dimIds);
    return series.map((s, index) => {
      if (index === 0) return paired.home;
      if (index === 1) return paired.away;
      return radarDisplayValues(s.scores, dimIds);
    });
  }
  return series.map((s) => radarDisplayValues(s.scores, dimIds));
}
