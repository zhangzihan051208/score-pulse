import { getDegradedMode } from "@/lib/service-degraded";
import {
  thesportsdbBudgets,
  thesportsdbKeyTier,
  thesportsdbLineupBudgets,
  thesportsdbListEnrichMax,
} from "@/lib/upstream-budget";
import { NextResponse } from "next/server";

export async function GET() {
  const mainMinute = thesportsdbBudgets().find((b) => b.key === "minute");
  const lineupMinute = thesportsdbLineupBudgets().find((b) => b.key === "lineup-minute");
  return NextResponse.json(
    {
      degraded: getDegradedMode(),
      thesportsdb: {
        tier: thesportsdbKeyTier(),
        minuteLimit: mainMinute?.limit ?? null,
        lineupMinuteLimit: lineupMinute?.limit ?? null,
        listEnrichMax: thesportsdbListEnrichMax(48),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
