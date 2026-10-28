import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./config";

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set from Server Component */
        }
      },
    },
  });
}

function serviceSupabaseCredentials(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  if (!/^https?:\/\/.+/i.test(url)) return null;
  return { url, key };
}

/** Bypasses RLS — server-only (sync jobs). */
export function createServiceClient() {
  const creds = serviceSupabaseCredentials();
  if (!creds) return null;
  try {
    return createSupabaseClient(creds.url, creds.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}
