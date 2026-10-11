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
  checkAfterHours?: number;
};

export const CHECK_AFTER_MIN_HOURS = 1;
export const CHECK_AFTER_MAX_HOURS = 14 * 24;
export const CHECK_AFTER_DEFAULT_HOURS = 7 * 24;

export function isCheckAfterHours(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= CHECK_AFTER_MIN_HOURS &&
    value <= CHECK_AFTER_MAX_HOURS
  );
}

export function savedCheckAfterHours(value: unknown) {
  return isCheckAfterHours(value) ? value : CHECK_AFTER_DEFAULT_HOURS;
}

export function formatCheckAfter(hours: number) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 day" : `${days} days`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}
