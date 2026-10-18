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
  const safe = clampScore(value);
  const pct = (safe / 10) * 100;

  function set(next: number) {
    onChange(clampScore(next));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{safe.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} -0.5`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted active:scale-95"
          onClick={() => set(safe - 0.5)}
        >
          <Minus className="size-3.5 pointer-events-none" />
        </button>
        <div className="relative min-w-0 flex-1 py-1">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--muted) ${pct}%, var(--muted) 100%)`,
            }}
          />
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={safe}
            aria-label={label}
            className="relative z-10 block h-8 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
            onInput={(e) => set(Number(e.currentTarget.value))}
            onChange={(e) => set(Number(e.currentTarget.value))}
          />
        </div>
        <button
          type="button"
          aria-label={`${label} +0.5`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted active:scale-95"
          onClick={() => set(safe + 0.5)}
        >
          <Plus className="size-3.5 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}
