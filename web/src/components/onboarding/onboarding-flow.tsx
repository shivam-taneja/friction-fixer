"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  isRepoName,
  markOnboardingComplete,
  onboardingSteps,
  parseWebsite,
  verificationToken,
  type AnalyticsChoice,
  type GoalChoice,
  type OwnershipMethod,
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
  const [method, setMethod] = useState<OwnershipMethod>("file");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsChoice>("PostHog");
  const [repo, setRepo] = useState("");
  const [goal, setGoal] = useState<GoalChoice>("Signup conversion");
  const [error, setError] = useState("");
  const verifyTimer = useRef<number | null>(null);
  const siteRef = useRef(site);
  const parsed = parseWebsite(site);
  const current = onboardingSteps[step];

  useEffect(() => {
    siteRef.current = site;
  }, [site]);

  useEffect(() => {
    return () => {
      if (verifyTimer.current) window.clearTimeout(verifyTimer.current);
    };
  }, []);

  function updateSite(value: string) {
    if (verifyTimer.current) window.clearTimeout(verifyTimer.current);
    setSite(value);
    setVerified(false);
    setChecking(false);
    setError("");
  }

  function verifyDomain() {
    if (!parsed) {
      setError("Enter a valid website address, like acme.so.");
      return;
    }
    setError("");
    setChecking(true);
    if (verifyTimer.current) window.clearTimeout(verifyTimer.current);
    const domain = parsed.domain;
    verifyTimer.current = window.setTimeout(() => {
      setChecking(false);
      if (parseWebsite(siteRef.current)?.domain === domain) setVerified(true);
    }, 700);
  }

  function next() {
    setError("");
    if (step === 0) {
      if (!parsed) {
        setError("Enter a valid website address, like acme.so.");
        return;
      }
      if (!verified) {
        setError("Verify that you own this domain before continuing.");
        return;
      }
      setSite(parsed.origin);
    }
    if (step === 2 && !isRepoName(repo)) {
      setError("Enter a repository as owner/repository.");
      return;
    }
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
      return;
    }
    markOnboardingComplete();
    router.push("/dashboard");
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
            next();
          }}
        >
          {step === 0 && (
            <WebsiteStep
              site={site}
              onSiteChange={updateSite}
              domain={parsed?.domain ?? null}
              method={method}
              onMethodChange={setMethod}
              token={parsed ? verificationToken(parsed.domain) : ""}
              verified={verified}
              checking={checking}
              onVerify={verifyDomain}
            />
          )}
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
              site={parsed?.origin ?? site}
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
            >
              {step === onboardingSteps.length - 1
                ? "Start my agent"
                : "Continue"}
              {step === onboardingSteps.length - 1 ? (
                <Sparkles />
              ) : (
                <ArrowRight />
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
