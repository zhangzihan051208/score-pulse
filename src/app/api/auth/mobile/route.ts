import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { json } from "@/lib/http";

type Body = {
  action?: "signIn" | "signUp" | "refresh";
  email?: string;
  password?: string;
  displayName?: string;
  refreshToken?: string;
};

function client() {
  return createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sessionPayload(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string };
}) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return json(request, { error: "Supabase not configured" }, 503);
  }
  const body = (await request.json().catch(() => ({}))) as Body;
  const supabase = client();

  if (body.action === "refresh") {
    const refreshToken = body.refreshToken?.trim();
    if (!refreshToken) return json(request, { error: "Missing refresh token" }, 400);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return json(request, { error: error?.message ?? "Refresh failed" }, 401);
    return json(request, sessionPayload(data.session));
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) return json(request, { error: "Email and password are required" }, 400);

  if (body.action === "signUp") {
    const displayName = body.displayName?.trim().slice(0, 32);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: displayName ? { display_name: displayName } : undefined },
    });
    if (error) return json(request, { error: error.message }, 400);
    if (!data.session) return json(request, { needsEmailConfirm: true, email });
    return json(request, sessionPayload(data.session));
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return json(request, { error: error?.message ?? "Sign in failed" }, 401);
  return json(request, sessionPayload(data.session));
}
