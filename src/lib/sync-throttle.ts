/** In-process cooldowns so read-heavy API routes do not hammer TSDB every request. */

const LIVE_BULK_REFRESH_MS = 45_000;
const SINGLE_FIXTURE_REFRESH_MS = 25_000;

let lastLiveBulkRefresh = 0;
const lastFixtureRefresh = new Map<string, number>();

export async function maybeRefreshLiveFixturesFromTsdb(
  run: (limit: number) => Promise<void>,
  limit = 8,
): Promise<boolean> {
  const now = Date.now();
  if (now - lastLiveBulkRefresh < LIVE_BULK_REFRESH_MS) return false;
  lastLiveBulkRefresh = now;
  await run(limit);
  return true;
}

export async function maybeRefreshFixtureFromTsdb<T>(
  idEvent: string,
  run: (id: string) => Promise<T>,
): Promise<T | null> {
  const now = Date.now();
  const last = lastFixtureRefresh.get(idEvent) ?? 0;
  if (now - last < SINGLE_FIXTURE_REFRESH_MS) return null;
  lastFixtureRefresh.set(idEvent, now);
  return run(idEvent);
}
