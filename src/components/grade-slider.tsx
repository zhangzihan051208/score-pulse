"use client";

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
  const pct = (value / 10) * 100;

  return (
    <div className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2 sm:grid-cols-[6.5rem_1fr_auto_2.5rem]">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative flex h-8 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-muted" />
        <div
          className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(clampScore(Number(e.target.value)))}
          className="relative z-10 h-8 w-full touch-none cursor-grab appearance-none bg-transparent active:cursor-grabbing [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
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
