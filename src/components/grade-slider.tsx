"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { clampScore } from "@/lib/store";

export function GradeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = (value / 10) * 100;

  function setFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const { left, width } = track.getBoundingClientRect();
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    onChange(clampScore(ratio * 10));
  }

  return (
    <div className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2 sm:grid-cols-[6.5rem_1fr_auto_2.5rem]">
      <span className="text-sm font-medium">{label}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={value.toFixed(1)}
        className="relative flex h-8 touch-none items-center select-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.focus();
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(clampScore(value - 0.5));
          }
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(clampScore(value + 0.5));
          }
        }}
      >
        <div className="h-2 w-full rounded-full bg-muted" />
        <div
          className="absolute h-2 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-md ring-2 ring-background"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          aria-label={`${label} -0.5`}
          className="flex size-7 items-center justify-center rounded-md border bg-background hover:bg-muted"
          onClick={() => onChange(clampScore(value - 0.5))}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`${label} +0.5`}
          className="flex size-7 items-center justify-center rounded-md border bg-background hover:bg-muted"
          onClick={() => onChange(clampScore(value + 0.5))}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <span className="text-right text-sm font-semibold tabular-nums">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
