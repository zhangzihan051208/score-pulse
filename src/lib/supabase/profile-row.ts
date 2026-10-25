import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  favorite_teams?: unknown;
  vip_until?: string | null;
  onboarding_completed_at?: string | null;
  updated_at?: string;
};

type ProfileResult = {
  data: ProfileRow | null;
  error: { message: string } | null;
};

const PROFILE_COLUMNS = [
  "id",
  "display_name",
  "avatar_url",
  "bio",
  "favorite_teams",
  "vip_until",
  "onboarding_completed_at",
  "updated_at",
];

/** PostgREST and Postgres phrase a missing column differently. */
export function missingColumn(message: string) {
  const cache = /Could not find the '([^']+)' column/.exec(message);
  if (cache) return cache[1];
  const sql = /column (?:[\w.]+\.)?"?([a-z_]+)"? does not exist/i.exec(message);
  return sql?.[1] ?? null;
}

export async function readProfile(supabase: SupabaseClient, userId: string): Promise<ProfileResult> {
  let columns = [...PROFILE_COLUMNS];
  for (let attempt = 0; attempt < PROFILE_COLUMNS.length; attempt++) {
    const result = await supabase.from("profiles").select(columns.join(",")).eq("id", userId).maybeSingle();
    if (!result.error) return { data: (result.data as unknown as ProfileRow | null) ?? null, error: null };
    const missing = missingColumn(result.error.message);
    if (!missing || !columns.includes(missing) || missing === "id") {
      return { data: null, error: { message: result.error.message } };
    }
    columns = columns.filter((column) => column !== missing);
  }
  return { data: null, error: { message: "Could not read profile" } };
}

export async function saveProfile(supabase: SupabaseClient, row: Record<string, unknown>): Promise<ProfileResult> {
  let payload = { ...row };
  let columns = [...PROFILE_COLUMNS];
  for (let attempt = 0; attempt < PROFILE_COLUMNS.length; attempt++) {
    const result = await supabase.from("profiles").upsert(payload).select(columns.join(",")).single();
    if (!result.error) return { data: result.data as unknown as ProfileRow, error: null };
    const missing = missingColumn(result.error.message);
    if (!missing) return { data: null, error: { message: result.error.message } };
    let changed = false;
    if (missing in payload) {
      const next = { ...payload };
      delete next[missing];
      payload = next;
      changed = true;
    }
    if (columns.includes(missing) && missing !== "id") {
      columns = columns.filter((column) => column !== missing);
      changed = true;
    }
    if (!changed) return { data: null, error: { message: result.error.message } };
  }
  return { data: null, error: { message: "Could not save profile" } };
}
