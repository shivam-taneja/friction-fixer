"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { finishOnboarding } from "@/app/onboarding/actions";
import { GithubConnection } from "@/components/github/github-connection";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  onboardingSteps,
  parseProjectGoal,
  type AnalyticsProvider,
} from "@/components/onboarding/logic";
import { AnalyticsStep } from "@/components/onboarding/steps/analytics-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { Button } from "@/components/ui/button";
import type { GithubSelection } from "@/lib/github/types";

export function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [analytics] = useState<AnalyticsProvider>("posthog");
  const [posthogConnected, setPosthogConnected] = useState(false);
  const [github, setGithub] = useState<GithubSelection | null>(null);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  const current = onboardingSteps[step];
  const lastStep = step === onboardingSteps.length - 1;
  const githubReady = Boolean(
    github?.fullName &&
    github.branch &&
    github.framework &&
    github.sourceFolder,
  );

  async function next() {
    setError("");

    if (current.id === "github" && !githubReady) {
      setError("Choose a repository, branch, and source folder.");
      return;
    }

    if (!lastStep) {
      setStep(step + 1);
      return;
    }

    if (!github) {
      setError("Choose a repository, branch, and source folder.");
      return;
    }

    const parsedGoal = await parseProjectGoal(goal);
    if (!parsedGoal.ok) {
      setError(parsedGoal.error);
      return;
    }

    setSaving(true);

    try {
      await finishOnboarding({ analytics, github, goal: parsedGoal.goal });
      router.replace("/dashboard/runs");
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
          {current.id === "analytics" && (
            <AnalyticsStep onConnectedChange={setPosthogConnected} />
          )}

          {current.id === "github" && (
            <GithubConnection
              selection={github}
              onSelectionChange={setGithub}
            />
          )}

          {current.id === "goal" && (
            <GoalStep
              goal={goal}
              onGoalChange={setGoal}
              analytics={analytics}
              github={github}
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
                className="cursor-pointer"
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
              className="h-11 px-4 cursor-pointer"
              disabled={
                saving ||
                (current.id === "analytics" && !posthogConnected) ||
                (current.id === "github" && !githubReady)
              }
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
