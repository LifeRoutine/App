"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLoading } from "@/components/app-loading";
import { useApp } from "@/lib/app-context";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { ready, state } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const onOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!ready) return;
    if (!state.profile.onboardingDone && !onOnboarding) {
      router.replace("/onboarding");
    }
    if (state.profile.onboardingDone && onOnboarding) {
      router.replace("/");
    }
  }, [ready, state.profile.onboardingDone, onOnboarding, router]);

  if (!ready) {
    return <AppLoading />;
  }

  if (!state.profile.onboardingDone && !onOnboarding) {
    return <AppLoading label="Weiterleitung zum Start…" />;
  }

  return <>{children}</>;
}
