"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/use-i18n";
import type { DegradedMode } from "@/lib/service-degraded";

export function DegradedBanner() {
  const { t } = useI18n();
  const [mode, setMode] = useState<DegradedMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { degraded?: DegradedMode };
        if (!cancelled && data.degraded?.active) setMode(data.degraded);
        else if (!cancelled) setMode(null);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!mode?.active) return null;

  return (
    <div
      className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-950 dark:text-amber-100"
      role="status"
    >
      {t.common.degradedBanner}
    </div>
  );
}
