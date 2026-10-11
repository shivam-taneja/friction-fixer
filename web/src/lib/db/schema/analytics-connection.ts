import { AnalyticsProvider } from "@/components/onboarding/logic";

export type AnalyticsConnectionRecord = {
  userId: string;
  siteId: string;
  provider: AnalyticsProvider;
  host: string;
  projectId: string;
  createdAt: unknown;
  updatedAt: unknown;
};
