"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useVipQuota } from "@/hooks/use-vip";
import { useI18n } from "@/i18n/use-i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function VipPageInner() {
  const { t } = useI18n();
  const { user, enabled, loading: authLoading } = useAuth();
  const { profile, loading, cloud } = useProfile();
  const { quota, reload } = useVipQuota();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled")) {
      setNote("canceled");
      return;
    }
    const sessionId = params.get("session_id");
    if (!sessionId || !user) return;
    let stop = false;
    void fetch("/api/vip/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (stop) return;
        if (!res.ok) setNote(data?.error ?? "buy_failed");
        else {
          setNote("activated");
          window.history.replaceState(null, "", "/profile/vip");
          await reload();
        }
      })
      .catch(() => {
        if (!stop) setNote("buy_failed");
      });
    return () => {
      stop = true;
    };
  }, [reload, user]);

  async function buy() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/vip/checkout", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setNote(data?.error ?? "buy_failed");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setNote("buy_failed");
      setBusy(false);
    }
  }

  const noteText =
    note === "canceled"
      ? t.vip.canceled
      : note === "activated"
        ? t.vip.activated
        : note === "stripe_not_configured"
          ? t.vip.stripeMissing
          : note
            ? t.vip.buyFailed
            : null;

  if (!enabled || !cloud) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10 text-sm text-muted-foreground">
        {t.profile.notConfigured}
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10 text-sm text-muted-foreground">
        {t.auth.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-8">
      <Link href="/profile" className="text-xs text-muted-foreground hover:underline">
        ← {t.profile.title}
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{t.vip.title}</h1>
        {profile?.isVip ? (
          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
            {t.vip.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {profile?.isVip ? t.vip.member : t.vip.guest}
      </p>

      <section className="mt-6 space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t.profile.vipEntryHint}</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>· {t.vip.benefitFull}</li>
          <li>· {t.vip.benefitWeight}</li>
        </ul>
        {profile?.isVip && profile.vipUntil ? (
          <p className="text-xs text-muted-foreground">
            {t.vip.activeUntil}{" "}
            {new Date(profile.vipUntil).toLocaleDateString(undefined, {
              dateStyle: "long",
            })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t.vip.quotaLine
              .replace("{used}", String(quota.fullRatingsToday))
              .replace("{limit}", String(quota.fullRatingsLimit))}
          </p>
        )}
        <div className="rounded-lg border border-dashed p-4">
          <p className="font-medium">{t.vip.planTitle}</p>
          <p className="mt-1 text-2xl font-bold">{t.vip.planPrice}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t.vip.demoNote}</p>
          {profile?.isVip ? null : user ? (
            <Button className="mt-4" disabled={busy} onClick={() => void buy()}>
              {busy ? t.vip.buying : t.vip.buy}
            </Button>
          ) : (
            <Link href="/login?next=/profile/vip" className={cn(buttonVariants(), "mt-4")}>
              {t.vip.buy}
            </Link>
          )}
          {noteText ? <p className="mt-3 text-sm text-primary">{noteText}</p> : null}
        </div>
      </section>
    </div>
  );
}
