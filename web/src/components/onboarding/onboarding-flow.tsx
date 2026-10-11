"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  isGithubSelection,
  type GithubSelection,
} from "@/lib/github/types";

const draftKey = "ff-onboarding-draft";

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [site, setSite] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsProvider>("posthog");
  const [github, setGithub] = useState<GithubSelection | null>(null);
  const [goal, setGoal] = useState<ProjectGoal>("signup_conversion");
  const [error, setError] = useState("");
  const restored = useRef(false);

  const current = onboardingSteps[step];
  const lastStep = step === onboardingSteps.length - 1;
  const githubReady = Boolean(github?.fullName && github.branch);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const draft = readDraft();
    const githubStep = onboardingSteps.findIndex((item) => item.id === "github");
    const githubError = searchParams.get("github_error");
    const returningFromGithub =
      searchParams.get("github") === "connected" || Boolean(githubError);
    const nextStep = returningFromGithub ? githubStep : (draft?.step ?? 0);

    if (draft) {
      setSite(draft.site);
      setAnalytics(draft.analytics);
      setGithub(draft.github);
      setGoal(draft.goal);
    }

    setStep(nextStep);
    if (githubError) setError(githubError);
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({
        step: nextStep,
        site: draft?.site ?? "",
        analytics: draft?.analytics ?? "posthog",
        github: draft?.github ?? null,
        goal: draft?.goal ?? "signup_conversion",
      }),
    );
    setReady(true);

    if (returningFromGithub) router.replace("/onboarding");
  }, [router, searchParams]);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({ step, site, analytics, github, goal }),
    );
  }, [analytics, github, goal, ready, site, step]);

  async function next() {
    setError("");

    if (current.id === "github" && !githubReady) {
      setError("Choose a repository and branch.");
      return;
    }

    if (!lastStep) {
      setStep(step + 1);
      return;
    }

    if (!github) {
      setError("Choose a repository and branch.");
      return;
    }

    setSaving(true);

    try {
      await finishOnboarding({ site, analytics, github, goal });
      sessionStorage.removeItem(draftKey);
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

          {step === 2 && (
            <GithubStep selection={github} onSelectionChange={setGithub} />
          )}

          {step === 3 && (
            <GoalStep
              goal={goal}
              onGoalChange={setGoal}
              site={site}
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
              disabled={saving || (current.id === "github" && !githubReady)}
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

function readDraft() {
  const raw = sessionStorage.getItem(draftKey);
  if (!raw) return null;

  try {
    const draft = JSON.parse(raw) as {
      step?: unknown;
      site?: unknown;
      analytics?: unknown;
      github?: unknown;
      goal?: unknown;
    };
    const step = typeof draft.step === "number" ? draft.step : 0;
    if (
      step < 0 ||
      step >= onboardingSteps.length ||
      typeof draft.site !== "string" ||
      !isAnalytics(draft.analytics) ||
      !isGoal(draft.goal) ||
      (draft.github != null && !isGithubSelection(draft.github))
    ) {
      return null;
    }

    return {
      step,
      site: draft.site,
      analytics: draft.analytics,
      github: isGithubSelection(draft.github) ? draft.github : null,
      goal: draft.goal,
    };
  } catch {
    return null;
  }
}

function isAnalytics(value: unknown): value is AnalyticsProvider {
  return value === "posthog" || value === "mixpanel" || value === "amplitude";
}

function isGoal(value: unknown): value is ProjectGoal {
  return (
    value === "signup_conversion" ||
    value === "checkout_completion" ||
    value === "contact_form"
  );
}
