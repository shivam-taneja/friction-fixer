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
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(days === 1 ? "1 day" : `${days} days`);
  if (rest > 0) parts.push(rest === 1 ? "1 hour" : `${rest} hours`);
  return parts.join(", ") || "1 hour";
}
