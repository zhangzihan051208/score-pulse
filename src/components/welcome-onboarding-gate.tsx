"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FavoritePartitionEditors } from "@/components/favorite-partition-editors";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import { useProfile } from "@/hooks/use-profile";
import { leagueLabel } from "@/i18n/league-labels";
import { useI18n } from "@/i18n/use-i18n";
import { favoritePartitions } from "@/lib/favorite-teams";
import {
  readOnboardingDoneLocal,
  writeOnboardingDoneLocal,
} from "@/lib/onboarding";
import type { FavoritePartition } from "@/lib/types";

type Step = "welcome" | "teams" | "ratings" | "zones";

const STEPS: Step[] = ["welcome", "teams", "ratings", "zones"];

export function WelcomeOnboardingGate() {
  const { locale, t } = useI18n();
  const { user, loading: authLoading, enabled } = useAuth();
  const { profile, loading: profileLoading, cloud, save } = useProfile();
  const { favorites, hydrated, patchPartition } = useFavoriteTeams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [finishing, setFinishing] = useState(false);
  const [interested, setInterested] = useState<Set<FavoritePartition>>(() => new Set());

  const partitions = useMemo(() => favoritePartitions(), []);

  useEffect(() => {
    if (!hydrated) return;
    const active = new Set<FavoritePartition>();
    for (const { key } of partitions) {
      const pair = favorites[key];
      if (pair?.primary || pair?.secondary) active.add(key);
    }
    setInterested(active);
  }, [hydrated, favorites, partitions]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!enabled || !cloud || !user) {
      setOpen(false);
      return;
    }
    if (readOnboardingDoneLocal(user.id)) {
      setOpen(false);
      return;
    }
    if (profile?.onboardingCompletedAt) {
      writeOnboardingDoneLocal(user.id);
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [authLoading, profileLoading, enabled, cloud, user, profile?.onboardingCompletedAt]);

  const stepIndex = STEPS.indexOf(step);

  const toggleInterest = useCallback(
    async (key: FavoritePartition, on: boolean) => {
      setInterested((prev) => {
        const next = new Set(prev);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      });
      if (!on) await patchPartition(key, null);
    },
    [patchPartition],
  );

  const complete = useCallback(async () => {
    if (!user) return;
    setFinishing(true);
    try {
      await save({ completeOnboarding: true });
      writeOnboardingDoneLocal(user.id);
      setOpen(false);
    } finally {
      setFinishing(false);
    }
  }, [save, user]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
        <div className="border-b px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t.onboarding.kicker}
          </p>
          <h2 id="onboarding-title" className="text-lg font-bold">
            {t.onboarding.title}
          </h2>
          <div className="mt-2 flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {step === "welcome" ? (
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{t.onboarding.welcomeLead}</p>
              <ul className="list-disc space-y-1 pl-5">
                {t.onboarding.welcomeBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === "teams" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.onboarding.teamsLead}</p>
              <div className="space-y-3">
                {partitions.map(({ key, league }) => {
                  const pair = favorites[key] ?? {};
                  const leagueSlug = league.sport === "soccer" ? league.slug : undefined;
                  const title =
                    league.sport === "nba"
                      ? t.sports.nba
                      : leagueLabel(locale, league.slug);
                  const on = interested.has(key);

                  return (
                    <div key={key} className="rounded-xl border bg-card p-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => void toggleInterest(key, e.target.checked)}
                          className="size-4 rounded border-input accent-primary"
                        />
                        <span className="font-medium">{title}</span>
                      </label>
                      {on ? (
                        <div className="mt-3">
                          <FavoritePartitionEditors
                            pair={pair}
                            sport={league.sport === "nba" ? "nba" : "soccer"}
                            leagueSlug={leagueSlug}
                            onChange={(next) => void patchPartition(key, next)}
                          />
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t.onboarding.leagueSkipped}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === "ratings" ? (
            <div className="space-y-3">
              <h3 className="font-semibold">{t.onboarding.ratingsTitle}</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {t.onboarding.ratingsBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href="/guide" className="inline-block text-sm text-primary hover:underline">
                {t.nav.guide} →
              </Link>
            </div>
          ) : null}

          {step === "zones" ? (
            <div className="space-y-3">
              <h3 className="font-semibold">{t.onboarding.zonesTitle}</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {t.onboarding.zonesBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href="/zones" className="mr-4 inline-block text-sm text-primary hover:underline">
                {t.zones.title} →
              </Link>
              <Link href="/zones/create" className="inline-block text-sm text-primary hover:underline">
                {t.zones.create} →
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <div>
            {step === "teams" ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setStep("ratings")}
              >
                {t.onboarding.skipTeams}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(STEPS[stepIndex - 1]!)}
              >
                {t.onboarding.back}
              </Button>
            ) : null}
            {step !== "zones" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(STEPS[stepIndex + 1]!)}
              >
                {t.onboarding.next}
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={finishing} onClick={() => void complete()}>
                {t.onboarding.finish}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
