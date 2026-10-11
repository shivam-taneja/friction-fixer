"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { finishOnboarding } from "@/app/onboarding/actions";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  onboardingSteps,
  type AnalyticsProvider,
  type ProjectGoal,
} from "@/components/onboarding/logic";
import { AnalyticsStep } from "@/components/onboarding/steps/analytics-step";
import { GithubStep } from "@/components/onboarding/steps/github-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { WebsiteStep } from "@/components/onboarding/steps/website-step";
import { Button } from "@/components/ui/button";

export function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [site, setSite] = useState("");
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsProvider>("posthog");
  const [repo, setRepo] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("signup_conversion");
  const [error, setError] = useState("");

  const current = onboardingSteps[step];
  const lastStep = step === onboardingSteps.length - 1;

  async function next() {
    setError("");

    if (!lastStep) {
      setStep(step + 1);
      return;
    }

    setSaving(true);

    try {
      await finishOnboarding();
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <OnboardingHeader />
      <main className="mx-auto w-full max-w-xl px-6 pt-10 pb-24">
        <OnboardingProgress step={step} />
        <p className="text-[11px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
          0{step + 1} / 0{onboardingSteps.length} — {current.label}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight max-sm:text-3xl">
          {current.title}
        </h1>
        <p className="mt-3 mb-8 text-sm leading-relaxed text-muted-foreground">
          {current.description}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void next();
          }}
        >
          {step === 0 && <WebsiteStep site={site} onSiteChange={setSite} />}

          {step === 1 && (
            <AnalyticsStep
              analytics={analytics}
              onAnalyticsChange={setAnalytics}
            />
          )}

          {step === 2 && <GithubStep repo={repo} onRepoChange={setRepo} />}

          {step === 3 && (
            <GoalStep
              goal={goal}
              onGoalChange={setGoal}
              site={site}
              analytics={analytics}
              repo={repo}
            />
          )}

          {error && (
            <p
              className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                type="button"
                disabled={saving}
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                <ArrowLeft />
                Back
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                About a minute.
              </span>
            )}
            <Button
              variant="hero"
              type="submit"
              size="lg"
              className="h-11 px-4"
              disabled={saving}
            >
              {saving ? "Saving…" : lastStep ? "Start my agent" : "Continue"}
              {lastStep ? <Rocket /> : <ArrowRight />}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
