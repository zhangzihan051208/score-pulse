/** Hard caps so a busy page cannot spend a provider's quota. */

export type BudgetWindow = {
  key: string;
  limit: number;
  windowMs: number;
};

type WindowState = {
  hits: number[];
  blockedUntil: number;
};

const windows = new Map<string, WindowState>();

function state(key: string): WindowState {
  let current = windows.get(key);
  if (!current) {
    current = { hits: [], blockedUntil: 0 };
    windows.set(key, current);
  }
  return current;
}

function freshHits(current: WindowState, windowMs: number, now: number) {
  current.hits = current.hits.filter((at) => now - at < windowMs);
}

/** True when another call would still fit. Does not consume a slot. */
export function upstreamAllows(name: string, budgets: BudgetWindow[], now = Date.now()): boolean {
  for (const budget of budgets) {
    const current = state(`${name}:${budget.key}`);
    if (now < current.blockedUntil) return false;
    freshHits(current, budget.windowMs, now);
    if (current.hits.length >= budget.limit) return false;
  }
  return true;
}

/** Consume one slot in every window, or refuse the call. */
export function takeUpstreamSlot(name: string, budgets: BudgetWindow[], now = Date.now()): boolean {
  if (!upstreamAllows(name, budgets, now)) return false;
  for (const budget of budgets) {
    state(`${name}:${budget.key}`).hits.push(now);
  }
  return true;
}

/** After HTTP 429, refuse new calls until the provider's window can recover. */
export function blockUpstream(name: string, budgets: BudgetWindow[], ms: number, now = Date.now()) {
  const until = now + ms;
  for (const budget of budgets) {
    const current = state(`${name}:${budget.key}`);
    if (current.blockedUntil < until) current.blockedUntil = until;
  }
}

export function resetUpstreamBudgets() {
  windows.clear();
}

/** TheSportsDB premium is 100 requests/minute. Stay at 40, and stop a runaway day at 20k. */
const TSDB_PREMIUM: BudgetWindow[] = [
  { key: "minute", limit: 40, windowMs: 60_000 },
  { key: "day", limit: 20_000, windowMs: 86_400_000 },
];

/** Shared free key. Keep it far under the public 30/minute cap. */
const TSDB_FREE: BudgetWindow[] = [
  { key: "minute", limit: 8, windowMs: 60_000 },
  { key: "day", limit: 1_500, windowMs: 86_400_000 },
];

export function thesportsdbBudgets(): BudgetWindow[] {
  const key = process.env.THESPORTSDB_API_KEY?.trim();
  return key && key !== "123" ? TSDB_PREMIUM : TSDB_FREE;
}

/** PandaScore free fixtures: 1,000 requests/hour. Leave a third unused. */
export const PANDASCORE_BUDGET: BudgetWindow[] = [
  { key: "hour", limit: 600, windowMs: 3_600_000 },
];

/** KashRock sandbox is 10/minute and 1,500 credits/day. Hobby is higher; this cap fits both. */
export const KASHROCK_BUDGET: BudgetWindow[] = [
  { key: "minute", limit: 8, windowMs: 60_000 },
  { key: "day", limit: 1_200, windowMs: 86_400_000 },
];
