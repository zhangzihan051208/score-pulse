"use client";

import {
  RADAR_GRID_LEVELS,
  radarDisplayValues,
  resolveRadarBaseline,
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
  baselineMean,
}: {
  dimIds: string[];
  dimLabels: string[];
  series: Series[];
  size?: number;
  /** Raw-score mean used as the center ring; defaults to first series average. */
  baselineMean?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = dimIds.length;
  const baseline = resolveRadarBaseline(dimIds, series, baselineMean);

  function point(i: number, unit: number) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (unit / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
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
      {RADAR_GRID_LEVELS.map((lv) => (
        <polygon
          key={lv}
          points={polygon(dimIds.map(() => lv))}
          fill="none"
          stroke="currentColor"
          strokeOpacity={lv === 5.5 ? 0.28 : 0.1}
          strokeWidth={lv === 5.5 ? 1.5 : 1}
          strokeDasharray={lv === 5.5 ? "4 3" : undefined}
        />
      ))}
      {dimIds.map((_, i) => {
        const p = point(i, 10);
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
      {series.map((s) => {
        const units = radarDisplayValues(s.scores, dimIds, baseline);
        return (
          <polygon
            key={s.label}
            points={polygon(units)}
            fill={s.fill}
            stroke={s.stroke}
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 0.12))" }}
          />
        );
      })}
      {dimLabels.map((label, i) => {
        const raw = series[0]?.scores[dimIds[i]!];
        const p = point(i, 11.4);
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
            {raw != null ? (
              <tspan className="fill-foreground/80 font-semibold">
                {" "}
                {raw.toFixed(1)}
              </tspan>
            ) : null}
          </text>
        );
      })}
    </svg>
  );
}
