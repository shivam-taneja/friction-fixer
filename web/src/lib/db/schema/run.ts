export const runCases = ["increased", "decreased"] as const;

export type RunCase = (typeof runCases)[number];

export const runStatuses = [
  "queued",
  "running",
  "kept",
  "undone",
  "failed",
  "blocked",
] as const;

export type RunStatus = (typeof runStatuses)[number];

export const runStepOrder = [
  { id: "project", title: "Project" },
  { id: "baseline", title: "Baseline" },
  { id: "plan", title: "Plan" },
  { id: "pull-request", title: "Pull request" },
  { id: "after", title: "After numbers" },
  { id: "verdict", title: "Verdict" },
  { id: "action", title: "Action" },
] as const;

export type RunStep = {
  id: string;
  title: string;
  detail: string;
  at: string | null;
};

export type RunNumbers = {
  bounceRate: number;
  scrollDepth: number;
  timeOnPage: number;
  pricingPageVisits: number;
};

export type RunPlan = {
  problem: string;
  evidence: string;
  change: string;
  file: string;
  expectedEffect: string;
};

export type RunVerdict = {
  decision: "KEEP" | "UNDO";
  reason: string;
  siteCheck: string;
};

export type RunRecord = {
  id: string;
  userId: string;
  case: RunCase;
  status: RunStatus;
  projectId: string;
  repository: string;
  branch: string;
  sourceFolder: string;
  goal: string;
  error: string;
  plan: RunPlan | null;
  pullRequestUrl: string;
  revertPullRequestUrl: string;
  verdict: RunVerdict | null;
  before: RunNumbers | null;
  after: RunNumbers | null;
  steps: RunStep[];
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export function isRunCase(value: string): value is RunCase {
  return runCases.some((item) => item === value);
}

export function isActiveRun(status: RunStatus) {
  return status === "queued" || status === "running" || status === "blocked";
}

export function activeRunId(runs: RunRecord[]) {
  return runs.find((run) => isActiveRun(run.status))?.id ?? null;
}

export function startingNumbers(runs: RunRecord[]): RunNumbers | null {
  const saved = runs
    .filter((run) => !isActiveRun(run.status))
    .filter((run) => run.before || run.after)
    .sort((a, b) => stamp(a).localeCompare(stamp(b)));
  const latest = saved[saved.length - 1];
  if (!latest) return null;
  if (latest.status === "kept" && latest.after) return latest.after;
  if (latest.status === "undone" && latest.before) return latest.before;
  return latest.before ?? latest.after;
}

function stamp(run: RunRecord) {
  return run.finishedAt || run.startedAt || run.createdAt || "";
}
