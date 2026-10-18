"use client";

import { useI18n } from "@/i18n/use-i18n";
import type { EventStatus } from "@/lib/types";

export function StatusPill({ status }: { status: EventStatus }) {
  const { t } = useI18n();
  const tone =
    status === "live"
      ? "bg-red-600 text-white"
      : status === "upcoming"
        ? "bg-zinc-800 text-white"
        : "bg-zinc-200 text-zinc-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${tone}`}>
      {status === "live" && (
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
      )}
      {t.status[status]}
    </span>
  );
}
