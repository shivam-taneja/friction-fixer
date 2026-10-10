import type { ProjectGoal } from "@/lib/db/schema/project";

export type GoalRecord = {
  userId: string;
  siteId: string;
  name: string;
  metric: ProjectGoal;
  windowDays: number;
  createdAt: unknown;
  updatedAt: unknown;
};
