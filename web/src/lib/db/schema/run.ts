export const runCases = ["increased", "decreased", "live"] as const;

export type RunCase = (typeof runCases)[number];

export const runStatuses = [
  "queued",
  "running",
  "kept",
  "undone",
  "failed",
  "blocked",
  "measuring",
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
  checkAfter: string | null;
  steps: RunStep[];
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export function isRunCase(value: string): value is RunCase {
  return runCases.some((item) => item === value);
}

export function isMockCase(value: string): value is "increased" | "decreased" {
  return value === "increased" || value === "decreased";
}

export function isActiveRun(status: RunStatus) {
  return status === "queued" || status === "running" || status === "blocked";
}

export function holdsRunLock(status: RunStatus) {
  return isActiveRun(status) || status === "measuring";
}

export function activeRunId(runs: RunRecord[]) {
  return runs.find((run) => holdsRunLock(run.status))?.id ?? null;
}

export function startingNumbers(
  runs: RunRecord[],
  projectId: string,
): RunNumbers | null {
  if (!projectId) return null;
  const saved = runs
    .filter((run) => run.projectId === projectId)
    .filter((run) => run.case !== "live")
    .filter((run) => !isActiveRun(run.status))
    .filter((run) => run.before || run.after)
    .sort((a, b) => stamp(a).localeCompare(stamp(b)));
  const latest = saved[saved.length - 1];
  if (!latest) return null;
  if (latest.status === "kept" && latest.after) return latest.after;
  if (latest.status === "undone" && latest.before) return latest.before;
  return latest.before ?? latest.after;
}

export type RunGroup = {
  projectId: string;
  repository: string;
  branch: string;
  sourceFolder: string;
  connectedAt: string | null;
  current: boolean;
  runs: RunRecord[];
};

export function groupRuns(
  runs: RunRecord[],
  current?: { id: string; createdAt: string | null } | null,
): RunGroup[] {
  const byProject = new Map<string, RunRecord[]>();
  for (const run of runs) {
    const key = run.projectId || run.id;
    const list = byProject.get(key);
    if (list) list.push(run);
    else byProject.set(key, [run]);
  }

  const groups = [...byProject.entries()].map(([projectId, items]) => {
    const sample = items[0];
    const currentProject = current?.id === projectId;
    return {
      projectId,
      repository: sample?.repository || "Repository",
      branch: sample?.branch || "",
      sourceFolder: sample?.sourceFolder || "",
      connectedAt: currentProject
        ? current?.createdAt || earliest(items)
        : earliest(items),
      current: currentProject,
      runs: items,
    };
  });

  groups.sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return (b.connectedAt ?? "").localeCompare(a.connectedAt ?? "");
  });
  return groups;
}

function earliest(runs: RunRecord[]) {
  return runs.reduce<string | null>((found, run) => {
    if (!run.createdAt) return found;
    if (!found || run.createdAt < found) return run.createdAt;
    return found;
  }, null);
}

function stamp(run: RunRecord) {
  return run.finishedAt || run.startedAt || run.createdAt || "";
}
