export enum OnboardingStatus {
  not_started = "not_started",
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
    projectId: string | null;
    completedAt: unknown | null;
  };
  activeRunId?: string | null;
  useMockData?: boolean;
};
