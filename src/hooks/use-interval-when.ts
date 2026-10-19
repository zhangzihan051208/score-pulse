"use client";

import { useEffect, useRef } from "react";

/** Run `tick` on an interval; pause when `intervalMs` is null. Optionally defer the first run. */
export function useIntervalWhen(
  tick: () => void,
  intervalMs: number | null,
  options?: { deferFirstMs?: number },
) {
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const deferFirstMs = options?.deferFirstMs ?? 0;

  useEffect(() => {
    if (intervalMs == null) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      tickRef.current();
      intervalId = setInterval(() => tickRef.current(), intervalMs);
    }, deferFirstMs);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [deferFirstMs, intervalMs]);
}
