export type GoalRecord = {
  userId: string;
  siteId: string;
  name: string;
  metric: "stay_rate" | "pricing_visits" | "custom";
  windowDays: number;
  createdAt: unknown;
  updatedAt: unknown;
};
