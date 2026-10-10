export const onboardingSteps = [
  "site",
  "verify",
  "github",
  "analytics",
  "goal",
  "done",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export type OnboardingStatus = "not_started" | "in_progress" | "complete";

export type AuthProviderName = "google" | "github";

export type ProviderLink = {
  accountId: string;
};

export type UserRecord = {
  email: string | null;
  name: string | null;
  image: string | null;
  providers: Partial<Record<AuthProviderName, ProviderLink>>;
  createdAt: unknown;
  updatedAt: unknown;
  onboarding: {
    status: OnboardingStatus;
    step: OnboardingStep;
    completedAt: unknown | null;
  };
};
