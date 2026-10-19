/** In-process degradation when TSDB or Supabase is slow/unavailable (single Node instance). */

export type DegradedMode = {
  active: boolean;
  cacheOnly: boolean;
  hideLineups: boolean;
  noRemoteSearch: boolean;
};

const DEFAULT: DegradedMode = {
  active: false,
  cacheOnly: false,
  hideLineups: false,
  noRemoteSearch: false,
};

let flags: Omit<DegradedMode, "active"> = {
  cacheOnly: false,
  hideLineups: false,
  noRemoteSearch: false,
};
let degradedUntil = 0;

const TSDB_FAIL_TTL_MS = 120_000;
const SUPABASE_FAIL_TTL_MS = 90_000;

export function getDegradedMode(): DegradedMode {
  if (Date.now() > degradedUntil) {
    flags = { cacheOnly: false, hideLineups: false, noRemoteSearch: false };
    return { ...DEFAULT };
  }
  return { active: true, ...flags };
}

export function markTsdbUnavailable() {
  flags = {
    cacheOnly: true,
    hideLineups: false,
    noRemoteSearch: true,
  };
  degradedUntil = Date.now() + TSDB_FAIL_TTL_MS;
}

export function markSupabaseUnavailable() {
  flags = {
    ...flags,
    cacheOnly: true,
    hideLineups: false,
  };
  degradedUntil = Math.max(degradedUntil, Date.now() + SUPABASE_FAIL_TTL_MS);
}

export function clearDegradedMode() {
  degradedUntil = 0;
  flags = { cacheOnly: false, hideLineups: false, noRemoteSearch: false };
}

/** Call after a successful Supabase read (clears false-positive degrade from schema fallbacks). */
export function noteSupabaseHealthy() {
  clearDegradedMode();
}

export function isBenignSupabaseSchemaError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("column") ||
    m.includes("does not exist") ||
    m.includes("id_home_team") ||
    m.includes("id_away_team") ||
    m.includes("lineup") ||
    m.includes("league_id")
  );
}

export async function withUpstreamTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => void,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout();
          reject(new Error("upstream_timeout"));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const UPSTREAM_TIMEOUT_MS = 4_500;
