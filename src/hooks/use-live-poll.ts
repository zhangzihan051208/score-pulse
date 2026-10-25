"use client";

import { useEffect } from "react";

export const LIVE_POLL_MS = 4000;

/** Reload a community thread while the screen is open. */
export function useLivePoll(load: () => void | Promise<unknown>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const run = () => {
      if (!stop) void load();
    };
    run();
    const id = setInterval(run, LIVE_POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [enabled, load]);
}
