"use client";

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
  size = 220,
}: {
  dimIds: string[];
  dimLabels: string[];
  series: Series[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const n = dimIds.length;
  const levels = [2, 4, 6, 8, 10];

  function point(i: number, value: number) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (Math.min(10, Math.max(0, value)) / 10) * maxR;
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
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-hidden
    >
      {levels.map((lv) => (
        <polygon
          key={lv}
          points={polygon(dimIds.map(() => lv))}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={1}
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
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        );
      })}
      {series.map((s) => (
        <polygon
          key={s.label}
          points={polygon(dimIds.map((id) => s.scores[id] ?? 0))}
          fill={s.fill}
          stroke={s.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
      {dimLabels.map((label, i) => {
        const p = point(i, 11.2);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {label.length > 8 ? `${label.slice(0, 7)}…` : label}
          </text>
        );
      })}
    </svg>
  );
}
