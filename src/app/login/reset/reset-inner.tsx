"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/use-i18n";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ResetPasswordInner() {
  const { t } = useI18n();
  const { user, loading, enabled } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t.auth.notConfigured}</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-3 py-10">
      <Link href="/login" className="text-xs text-muted-foreground hover:underline">
        ← {t.auth.signIn}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{t.auth.resetTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.auth.resetLead}</p>

      {loading || !enabled ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.auth.loading}</p>
      ) : !user ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.auth.resetMissing}</p>
      ) : done ? (
        <p className="mt-6 text-sm text-primary">{t.auth.resetDone}</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="new-password">
              {t.auth.newPassword}
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {t.auth.resetSubmit}
          </Button>
        </form>
      )}
    </div>
  );
}
