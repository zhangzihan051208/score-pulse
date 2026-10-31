import type { ScoreMap } from "@/lib/types";

/** When false, daily caps and VIP checkout are off; everyone gets full five-axis ratings. */
export const VIP_BILLING_ENABLED = false;

export const FREE_FULL_RATINGS_PER_DAY = 5;
export const VIP_RATING_WEIGHT = 2;
export const STANDARD_RATING_WEIGHT = 1;

/** Store subscription. €7 per month. Create these products before charging. */
export const VIP_PRODUCT_NAME = "看台月卡";
export const VIP_PRODUCT_NAME_EN = "Grandstand Monthly";
export const VIP_PRICE_EUR = 7;
export const VIP_APPLE_PRODUCT_ID = "com.grandstand.tribune.vip.monthly";
export const VIP_GOOGLE_PRODUCT_ID = "grandstand_vip_monthly";

export type RatingMode = "full" | "overall_only";

export function isVipActive(vipUntil: string | null | undefined): boolean {
  if (!VIP_BILLING_ENABLED) return false;
  if (!vipUntil) return false;
  return new Date(vipUntil).getTime() > Date.now();
}

export function utcDayStartIso(d = new Date()): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  ).toISOString();
}

export function scoresFromOverall(overall: number, dimIds: string[]): ScoreMap {
  const v = Math.min(10, Math.max(1, Number(overall.toFixed(1))));
  const out: ScoreMap = {};
  for (const id of dimIds) out[id] = v;
  return out;
}

export function isUniformOverallScores(scores: ScoreMap, dimIds: string[]): boolean {
  if (dimIds.length === 0) return false;
  const vals = dimIds.map((id) => scores[id]).filter((n) => n != null);
  if (vals.length !== dimIds.length) return false;
  return vals.every((v) => Math.abs(v - vals[0]!) < 0.01);
}
