"use client";

import dynamic from "next/dynamic";

const WelcomeOnboardingGate = dynamic(
  () =>
    import("@/components/welcome-onboarding-gate").then((m) => ({
      default: m.WelcomeOnboardingGate,
    })),
  { ssr: false },
);

export function ClientChromeExtras() {
  return <WelcomeOnboardingGate />;
}
