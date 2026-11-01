/** Supabase calls must not hold a page open. A full disk leaves Auth and PostgREST hanging. */
export const SUPABASE_FETCH_MS = 2_000;

export function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(SUPABASE_FETCH_MS);
  if (!init?.signal) return fetch(input, { ...init, signal: timeout });
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal.aborted || timeout.aborted) controller.abort();
  else {
    init.signal.addEventListener("abort", abort, { once: true });
    timeout.addEventListener("abort", abort, { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal });
}
