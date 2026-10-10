import { OnboardingStatus } from "@/lib/db/schema/user";

export const projectSteps = [
  "site",
  "verify",
  "analytics",
  "github",
  "goal",
  "done",
] as const;

export type ProjectStep = (typeof projectSteps)[number];

export const analyticsProviders = ["posthog", "mixpanel", "amplitude"] as const;
export type AnalyticsProvider = (typeof analyticsProviders)[number];

export const projectGoals = [
  "signup_conversion",
  "checkout_completion",
  "contact_form",
] as const;
export type ProjectGoal = (typeof projectGoals)[number];

export type OwnershipMethod = "file" | "dns";

export type ProjectRecord = {
  userId: string;
  url: string | null;
  domain: string | null;
  ownership: {
    status: "pending" | "verified";
    method: OwnershipMethod | null;
    token: string;
    verifiedAt: unknown | null;
  };
  analyticsProvider: AnalyticsProvider | null;
  repoFullName: string | null;
  goal: ProjectGoal | null;
  onboarding: {
    status: OnboardingStatus;
    step: ProjectStep;
    completedAt: unknown | null;
  };
  createdAt: unknown;
  updatedAt: unknown;
};
