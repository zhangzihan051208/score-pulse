import type { ReactNode } from "react";
import { PausedSection } from "@/components/paused-section";
import { ZONES_ENABLED } from "@/lib/features";

export default function ZonesLayout({ children }: { children: ReactNode }) {
  if (!ZONES_ENABLED) return <PausedSection />;
  return children;
}
