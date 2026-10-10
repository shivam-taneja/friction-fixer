export type AnalyticsConnectionRecord = {
  userId: string;
  siteId: string;
  provider: "posthog";
  host: string;
  projectId: string;
  createdAt: unknown;
  updatedAt: unknown;
};
