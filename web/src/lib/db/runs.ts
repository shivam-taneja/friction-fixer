import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/db/firebase";
import { COLLECTIONS } from "@/lib/db/collections";
import {
  type RunCase,
  type RunNumbers,
  type RunPlan,
  type RunRecord,
  type RunStatus,
  type RunStep,
  type RunVerdict,
} from "@/lib/db/schema/run";

const SANDBOX_LIMIT = 2;
const WAIT_MESSAGE =
  "Too much demand right now. Please wait a little and try again.";

export class RunRejected extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly runId?: string,
  ) {
    super(message);
  }
}

export async function createRun(userId: string, runCase: RunCase) {
  const firestore = db();
  const runRef = firestore.collection(COLLECTIONS.RUNS).doc();
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);

  await firestore.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new RunRejected("Sign in again before starting a run.", 401);
    }

    const activeId = userSnap.get("activeRunId");
    if (typeof activeId === "string" && activeId) {
      const activeSnap = await transaction.get(
        firestore.collection(COLLECTIONS.RUNS).doc(activeId),
      );
      const activeStatus = activeSnap.get("status");
      if (
        activeSnap.exists &&
        (activeStatus === "queued" || activeStatus === "running")
      ) {
        throw new RunRejected("A run is already in progress.", 409, activeId);
      }
    }

    const busySnap = await transaction.get(
      firestore
        .collection(COLLECTIONS.RUNS)
        .where("status", "in", ["queued", "running"])
        .limit(SANDBOX_LIMIT),
    );
    if (busySnap.size >= SANDBOX_LIMIT) {
      throw new RunRejected(WAIT_MESSAGE, 429);
    }

    const projectSnap = await transaction.get(
      firestore
        .collection(COLLECTIONS.PROJECTS)
        .where("userId", "==", userId)
        .limit(1),
    );
    const project = projectSnap.docs[0];
    if (!project) {
      throw new RunRejected("Finish setup before starting a run.", 409);
    }

    const data = project.data();
    transaction.set(runRef, {
      userId,
      case: runCase,
      status: "queued",
      projectId: project.id,
      repository: text(data.repository),
      branch: text(data.branch),
      sourceFolder: text(data.sourceFolder),
      goal: text(data.goal),
      error: "",
      plan: null,
      pullRequestUrl: "",
      revertPullRequestUrl: "",
      verdict: null,
      before: null,
      after: null,
      steps: {},
      createdAt: FieldValue.serverTimestamp(),
      startedAt: null,
      finishedAt: null,
    });
    transaction.update(userRef, {
      activeRunId: runRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return runRef.id;
}

export async function failRun(userId: string, runId: string, error: string) {
  const firestore = db();
  const runRef = firestore.collection(COLLECTIONS.RUNS).doc(runId);
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);

  await firestore.runTransaction(async (transaction) => {
    const runSnap = await transaction.get(runRef);
    const userSnap = await transaction.get(userRef);
    if (!runSnap.exists || runSnap.get("userId") !== userId) return;

    transaction.update(runRef, {
      status: "failed",
      error,
      finishedAt: FieldValue.serverTimestamp(),
    });
    if (userSnap.get("activeRunId") === runId) {
      transaction.update(userRef, {
        activeRunId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

export async function listRuns(userId: string) {
  const snap = await db()
    .collection(COLLECTIONS.RUNS)
    .where("userId", "==", userId)
    .get();

  return snap.docs
    .map((doc) => toRun(doc.id, doc.data()))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getRun(userId: string, runId: string) {
  const snap = await db().collection(COLLECTIONS.RUNS).doc(runId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data || data.userId !== userId) return null;
  return toRun(snap.id, data);
}

export async function assertCapacity() {
  const response = await agentFetch("/capacity");
  if (response.status === 429) {
    throw new RunRejected(await agentError(response), 429);
  }
  if (!response.ok) {
    throw new RunRejected("The agent did not accept the run.", 502);
  }
}

export async function startAgent(input: {
  runId: string;
  userId: string;
  case: RunCase;
}) {
  const response = await agentFetch("/runs", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (response.status === 429) {
    throw new RunRejected(await agentError(response), 429);
  }
  if (!response.ok) {
    throw new RunRejected("The agent did not accept the run.", 502);
  }
}

async function agentFetch(path: string, init?: RequestInit) {
  const url = process.env.AGENT_URL?.replace(/\/$/, "");
  const secret = process.env.AGENT_SECRET?.trim();
  if (!url || !secret) {
    throw new RunRejected("Set AGENT_URL and AGENT_SECRET.", 503);
  }

  try {
    return await fetch(`${url}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new RunRejected("The agent did not accept the run.", 502);
  }
}

async function agentError(response: Response) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" && body.error
    ? body.error
    : WAIT_MESSAGE;
}

function toRun(id: string, data: DocumentData): RunRecord {
  const status = runStatus(data.status);
  return {
    id,
    userId: text(data.userId),
    case: data.case === "decreased" ? "decreased" : "increased",
    status,
    projectId: text(data.projectId),
    repository: text(data.repository),
    branch: text(data.branch),
    sourceFolder: text(data.sourceFolder),
    goal: text(data.goal),
    error: text(data.error),
    plan: plan(data.plan),
    pullRequestUrl: text(data.pullRequestUrl),
    revertPullRequestUrl: text(data.revertPullRequestUrl),
    verdict: verdict(data.verdict),
    before: numbers(data.before),
    after: numbers(data.after),
    steps: steps(data.steps),
    createdAt: time(data.createdAt),
    startedAt: time(data.startedAt),
    finishedAt: time(data.finishedAt),
  };
}

function runStatus(value: unknown): RunStatus {
  if (
    value === "queued" ||
    value === "running" ||
    value === "kept" ||
    value === "undone" ||
    value === "failed"
  ) {
    return value;
  }
  return "failed";
}

function steps(value: unknown): RunStep[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([id, step]) => {
    if (!step || typeof step !== "object") return [];
    const record = step as Record<string, unknown>;
    return [
      {
        id,
        title: text(record.title) || id,
        detail: text(record.detail),
        at: time(record.at),
      },
    ];
  });
}

function plan(value: unknown): RunPlan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!text(record.change)) return null;
  return {
    problem: text(record.problem),
    evidence: text(record.evidence),
    change: text(record.change),
    file: text(record.file),
    expectedEffect: text(record.expectedEffect),
  };
}

function verdict(value: unknown): RunVerdict | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.decision !== "KEEP" && record.decision !== "UNDO") return null;
  return {
    decision: record.decision,
    reason: text(record.reason),
    siteCheck: text(record.siteCheck),
  };
}

function numbers(value: unknown): RunNumbers | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.bounceRate !== "number") return null;
  return {
    bounceRate: record.bounceRate,
    scrollDepth:
      typeof record.scrollDepth === "number" ? record.scrollDepth : 0,
    timeOnPage: typeof record.timeOnPage === "number" ? record.timeOnPage : 0,
    pricingPageVisits:
      typeof record.pricingPageVisits === "number"
        ? record.pricingPageVisits
        : 0,
  };
}

function time(value: unknown) {
  if (typeof value === "string" && value) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
