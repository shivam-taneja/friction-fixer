"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  isRepoName,
  onboardingSteps,
  parseWebsite,
  uiStepIndex,
  type AnalyticsProvider,
  type OwnershipMethod,
  type ProjectGoal,
} from "@/components/onboarding/logic";
import { postOnboarding } from "@/components/onboarding/save";
import { AnalyticsStep } from "@/components/onboarding/steps/analytics-step";
import { GithubStep } from "@/components/onboarding/steps/github-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { WebsiteStep } from "@/components/onboarding/steps/website-step";
import { Button } from "@/components/ui/button";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function OnboardingFlow({ initial }: { initial: OnboardingDraft }) {
  const router = useRouter();
  const [step, setStep] = useState(() => uiStepIndex(initial.step));
  const [site, setSite] = useState(initial.site);
  const [method, setMethod] = useState<OwnershipMethod>(initial.method);
  const [verified, setVerified] = useState(initial.verified);
  const [token, setToken] = useState(initial.token);
  const [savedDomain, setSavedDomain] = useState(initial.domain);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsProvider>(initial.analytics);
  const [repo, setRepo] = useState(initial.repo);
  const [goal, setGoal] = useState<ProjectGoal>(initial.goal);
  const [error, setError] = useState("");
  const siteRef = useRef(site);
  const tokenRef = useRef(token);
  const savedKey = useRef(`${initial.site}:${initial.method}`);
  tokenRef.current = token;
  const parsed = parseWebsite(site);
  const current = onboardingSteps[step];

  useEffect(() => {
    siteRef.current = site;
  }, [site]);

  useEffect(() => {
    if (!parsed) return;
    const origin = parsed.origin;
    const domain = parsed.domain;
    const nextMethod = method;
    const key = `${origin}:${nextMethod}`;
    if (savedKey.current === key && tokenRef.current) return;

    const timer = window.setTimeout(() => {
      void postOnboarding({ action: "site", url: origin, method: nextMethod })
        .then((draft) => {
          if (parseWebsite(siteRef.current)?.domain !== domain) return;
          savedKey.current = `${draft.site}:${draft.method}`;
          setToken(draft.token);
          setSavedDomain(draft.domain);
          setVerified(draft.verified);
        })
        .catch((caught: unknown) => {
          if (parseWebsite(siteRef.current)?.domain !== domain) return;
          const failure = caught as Error & { draft?: OnboardingDraft };
          if (failure.draft) {
            setToken(failure.draft.token);
            setSavedDomain(failure.draft.domain);
            setVerified(failure.draft.verified);
          }
          setError(failure.message);
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [parsed?.domain, parsed?.origin, method]);

  function updateSite(value: string) {
    setSite(value);
    setError("");
    const next = parseWebsite(value);
    if (next?.domain !== savedDomain) {
      setVerified(false);
      setToken("");
    }
  }

  function applyDraft(draft: OnboardingDraft) {
    savedKey.current = `${draft.site}:${draft.method}`;
    setToken(draft.token);
    setSavedDomain(draft.domain);
    setVerified(draft.verified);
    setMethod(draft.method);
    setAnalytics(draft.analytics);
    setRepo(draft.repo);
    setGoal(draft.goal);
    if (draft.site) setSite(draft.site);
  }

  async function verifyDomain() {
    if (!parsed) {
      setError("Enter a valid website address, like acme.so.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const draft = await postOnboarding({
        action: "verify",
        url: parsed.origin,
        method,
      });
      applyDraft(draft);
    } catch (caught) {
      const failure = caught as Error & { draft?: OnboardingDraft };
      if (failure.draft) applyDraft(failure.draft);
      setError(failure.message);
    } finally {
      setChecking(false);
    }
  }

  async function next() {
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
      setStep(1);
      return;
    }

    if (step === 2 && !isRepoName(repo)) {
      setError("Enter a repository as owner/repository.");
      return;
    }

    setSaving(true);
    try {
      if (step === 1) {
        applyDraft(
          await postOnboarding({ action: "analytics", provider: analytics }),
        );
        setStep(2);
        return;
      }
      if (step === 2) {
        applyDraft(await postOnboarding({ action: "github", repo }));
        setStep(3);
        return;
      }
      await postOnboarding({ action: "goal", goal });
      router.push("/dashboard");
    } catch (caught) {
      const failure = caught as Error & { draft?: OnboardingDraft };
      if (failure.draft) applyDraft(failure.draft);
      setError(failure.message);
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
          {step === 0 && (
            <WebsiteStep
              site={site}
              onSiteChange={updateSite}
              domain={parsed?.domain ?? null}
              method={method}
              onMethodChange={setMethod}
              token={token}
              verified={verified}
              checking={checking}
              onVerify={() => void verifyDomain()}
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
              disabled={saving || checking}
            >
              {saving
                ? "Saving…"
                : step === onboardingSteps.length - 1
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
