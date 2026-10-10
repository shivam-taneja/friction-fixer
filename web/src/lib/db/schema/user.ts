export const onboardingSteps = [
  "site",
  "verify",
  "github",
  "analytics",
  "goal",
  "done",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export enum OnboardingStatus {
  not_started = "not_started",
  in_progress = "in_progress",
  complete = "complete",
}

export type AuthProviderName = "google" | "github";

export type ProviderLink = {
  accountId: string;
  connectedAt: unknown;
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
