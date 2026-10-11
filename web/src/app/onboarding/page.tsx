import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Set up your agent — Friction Fixer",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <OnboardingFlow />
    </Suspense>
  );
}
