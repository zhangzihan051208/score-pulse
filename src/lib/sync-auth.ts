/** Shared auth for /api/sync/* and /api/cron/* fixture jobs. */
export function authorizeSyncJob(request: Request): boolean {
  const syncSecret = process.env.SYNC_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (syncSecret && bearer === syncSecret) return true;
  if (cronSecret && bearer === cronSecret) return true;
  if (!syncSecret && !cronSecret) return true;
  return false;
}
