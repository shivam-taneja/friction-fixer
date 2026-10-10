import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { loadOnboardingDraft } from "@/lib/onboarding/load";

export const metadata: Metadata = {
  title: "Set up your agent — Friction Fixer",
  robots: { index: false, follow: false },
};

async function OnboardingScreen() {
  await connection();
  const draft = await loadOnboardingDraft();
  if (!draft) redirect("/auth");
  if (draft.complete) redirect("/dashboard");

  return <OnboardingFlow initial={draft} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <OnboardingScreen />
    </Suspense>
  );
}
