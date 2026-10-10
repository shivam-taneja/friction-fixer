import type {
  AnalyticsProvider,
  OwnershipMethod,
  ProjectGoal,
  ProjectRecord,
  ProjectStep,
} from "@/lib/db/schema/project";
import { OnboardingStatus } from "@/lib/db/schema/user";

export type OnboardingDraft = {
  projectId: string;
  site: string;
  domain: string | null;
  token: string;
  method: OwnershipMethod;
  verified: boolean;
  analytics: AnalyticsProvider;
  repo: string;
  goal: ProjectGoal;
  step: ProjectStep;
  complete: boolean;
};

export type OnboardingAction =
  | { action: "site"; url: string; method: OwnershipMethod }
  | { action: "verify"; url: string; method: OwnershipMethod }
  | { action: "analytics"; provider: AnalyticsProvider }
  | { action: "github"; repo: string }
  | { action: "goal"; goal: ProjectGoal };

export function toOnboardingDraft(
  project: { id: string } & ProjectRecord,
): OnboardingDraft {
  return {
    projectId: project.id,
    site: project.url ?? "",
    domain: project.domain,
    token: project.ownership.token,
    method: project.ownership.method ?? "file",
    verified: project.ownership.status === "verified",
    analytics: project.analyticsProvider ?? "posthog",
    repo: project.repoFullName ?? "",
    goal: project.goal ?? "signup_conversion",
    step: project.onboarding.step,
    complete:
      project.onboarding.status === OnboardingStatus.complete ||
      project.onboarding.step === "done",
  };
}
