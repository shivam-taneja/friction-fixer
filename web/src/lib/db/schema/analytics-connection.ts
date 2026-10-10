import type { AnalyticsProvider } from "@/lib/db/schema/project";

export type AnalyticsConnectionRecord = {
  userId: string;
  siteId: string;
  provider: AnalyticsProvider;
  host: string;
  projectId: string;
  createdAt: unknown;
  updatedAt: unknown;
};
