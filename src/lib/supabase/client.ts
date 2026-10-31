"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";
import { supabaseFetch } from "./timeout-fetch";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(supabaseUrl(), supabaseAnonKey(), {
    global: { fetch: supabaseFetch },
  });
}
