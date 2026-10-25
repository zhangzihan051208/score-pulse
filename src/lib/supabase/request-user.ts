import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? "";
}

/** Cookie session for the website, bearer token for the phone. */
export async function requestUser(request: Request) {
  if (!isSupabaseConfigured()) {
    return { supabase: null as SupabaseClient | null, user: null, token: "" };
  }
  const token = bearerToken(request);
  if (token) {
    const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase.auth.getUser(token);
    return { supabase, user: data.user, token };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user, token: "" };
}

/** Writes that must replace an existing comment. Service role bypasses the missing delete policy. */
export function writeClient(supabase: SupabaseClient) {
  return createServiceClient() ?? supabase;
}

/** Older projects created ratings before rating_mode existed. */
export async function upsertRating(
  db: SupabaseClient,
  row: Record<string, unknown>,
) {
  const first = await db.from("ratings").upsert(row, { onConflict: "user_id,event_id,athlete_id" });
  if (first.error && /rating_mode/.test(first.error.message)) {
    const { rating_mode: _mode, ...rest } = row;
    return db.from("ratings").upsert(rest, { onConflict: "user_id,event_id,athlete_id" });
  }
  return first;
}
