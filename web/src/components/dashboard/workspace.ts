export type ChangeStatus = "Review" | "Kept" | "Reverted";

export type WorkspaceChange = {
  id: string;
  title: string;
  page: string;
  pullRequest: number;
  status: ChangeStatus;
  note?: string;
};

export const goal = "Signup conversion";

export const changes: WorkspaceChange[] = [
  {
    id: "pr-42",
    title: "Move primary CTA above the fold",
    page: "Pricing page",
    pullRequest: 42,
    status: "Review",
  },
  {
    id: "pr-41",
    title: "Pricing CTA improvement",
    page: "Pricing page",
    pullRequest: 41,
    status: "Kept",
    note: "+18.7% lift",
  },
  {
    id: "pr-38",
    title: "Longer signup form",
    page: "Signup",
    pullRequest: 38,
    status: "Reverted",
  },
];

export const reviewCount = changes.filter(
  (change) => change.status === "Review",
).length;
