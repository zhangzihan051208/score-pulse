"use client";

import { useEffect, useRef, useState } from "react";
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
  const dragging = useRef(false);
  const onChangeRef = useRef(onChange);
  const [live, setLive] = useState(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!dragging.current) setLive(value);
  }, [value]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const track = trackRef.current;
      if (!track) return;
      const { left, width } = track.getBoundingClientRect();
      if (width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (e.clientX - left) / width));
      const next = clampScore(ratio * 10);
      setLive(next);
      onChangeRef.current(next);
    }
    function onUp() {
      dragging.current = false;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function nudge(delta: number) {
    const next = clampScore(live + delta);
    setLive(next);
    onChangeRef.current(next);
  }

  function startDrag(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    dragging.current = true;
    const { left, width } = track.getBoundingClientRect();
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
    const next = clampScore(ratio * 10);
    setLive(next);
    onChangeRef.current(next);
  }

  const pct = (live / 10) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{live.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} -0.5`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted"
          onClick={() => nudge(-0.5)}
        >
          <Minus className="size-3.5" />
        </button>
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={live}
          aria-valuetext={live.toFixed(1)}
          className="relative h-8 min-w-0 flex-1 cursor-pointer touch-none select-none"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startDrag(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              nudge(-0.5);
            }
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              nudge(0.5);
            }
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 m-auto h-2 rounded-full bg-muted" />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 m-auto h-2 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-md"
            style={{ left: `${pct}%` }}
          />
        </div>
        <button
          type="button"
          aria-label={`${label} +0.5`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted"
          onClick={() => nudge(0.5)}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
