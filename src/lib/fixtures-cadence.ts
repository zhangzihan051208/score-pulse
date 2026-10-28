/**
 * Football (soccer) + NBA sync cadence for TheSportsDB premium livescores (~2 min).
 * Keep server refresh, scheduled jobs, and client polls on the same clock.
 */

/** Pull every league's latest fixtures into Supabase. */
export const SCHEDULE_SYNC_MS = 180_000;

/** Refresh in-play scores from the provider (one lookup per live match). */
export const LIVE_SCORE_REFRESH_MS = 120_000;

/** Browser poll while matches are live — matches LIVE_SCORE_REFRESH_MS. */
export const CLIENT_LIVE_POLL_MS = LIVE_SCORE_REFRESH_MS;

/** Poll a little faster near kickoff; upstream still refreshes at LIVE_SCORE_REFRESH_MS. */
export const CLIENT_KICKOFF_SOON_POLL_MS = 60_000;

export const SCHEDULE_SYNC_SEC = SCHEDULE_SYNC_MS / 1000;
export const LIVE_SCORE_REFRESH_SEC = LIVE_SCORE_REFRESH_MS / 1000;
