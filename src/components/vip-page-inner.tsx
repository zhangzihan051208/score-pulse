"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useVipQuota } from "@/hooks/use-vip";
import { useI18n } from "@/i18n/use-i18n";

export function VipPageInner() {
  const { t } = useI18n();
  const { user, enabled, loading: authLoading } = useAuth();
  const { profile, loading, cloud, reload: reloadProfile } = useProfile();
  const { quota, reload: reloadVip } = useVipQuota();
  const [vipBusy, setVipBusy] = useState(false);
  const [vipMsg, setVipMsg] = useState<string | null>(null);

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

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10">
        <p className="text-sm text-muted-foreground">{t.profile.signInRequired}</p>
        <Link href="/login?next=/profile/vip" className="mt-4 text-primary hover:underline">
          {t.auth.signIn}
        </Link>
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
          <p className="mt-2 text-sm text-muted-foreground">{t.vip.planPrice}</p>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={vipBusy}
            onClick={async () => {
              setVipBusy(true);
              setVipMsg(null);
              try {
                const res = await fetch("/api/vip/activate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ days: 30 }),
                });
                const data = (await res.json()) as { error?: string };
                if (!res.ok) {
                  setVipMsg(data.error ?? t.auth.failed);
                  return;
                }
                setVipMsg(t.vip.activated);
                await Promise.all([reloadProfile(), reloadVip()]);
              } finally {
                setVipBusy(false);
              }
            }}
          >
            {t.vip.activate}
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">{t.vip.demoNote}</p>
        </div>
        {vipMsg ? <p className="text-sm text-primary">{vipMsg}</p> : null}
      </section>
    </div>
  );
}
