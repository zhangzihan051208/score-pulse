"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-3 py-16 text-center">
        <h1 className="text-xl font-bold">{t.auth.signIn}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.auth.notConfigured}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          ← {t.nav.home}
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    const supabase = createClient();

    try {
      if (mode === "signUp") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) throw signUpError;
        setMessage(t.auth.checkEmail);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-3 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{t.auth.signIn}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.auth.lead}</p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            {t.auth.email}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            {t.auth.password}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-primary">{message}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "signUp" ? t.auth.createAccount : t.auth.signIn}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          setMode(mode === "signIn" ? "signUp" : "signIn");
          setError(null);
          setMessage(null);
        }}
      >
        {mode === "signIn" ? t.auth.needAccount : t.auth.haveAccount}
      </button>
    </div>
  );
}
