import type { AnalyticsProvider, ProjectGoal } from "@/components/onboarding/logic";

export type ProjectRecord = {
  userId: string;
  siteUrl: string;
  analyticsProvider: AnalyticsProvider;
  goal: ProjectGoal;
  repository: string;
  branch: string;
  framework: string;
  sourceFolder: string;
  installationId: number;
  accountLogin: string;
  createdAt: unknown;
  updatedAt: unknown;
};
