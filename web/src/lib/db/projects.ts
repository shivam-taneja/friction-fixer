import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/db/firebase";
import {
  analyticsProviders,
  projectGoals,
  projectSteps,
  type AnalyticsProvider,
  type OwnershipMethod,
  type ProjectGoal,
  type ProjectRecord,
  type ProjectStep,
} from "@/lib/db/schema/project";
import { OnboardingStatus } from "@/lib/db/schema/user";
import {
  toOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";
import {
  assertPublicDomain,
  dnsHasToken,
  fileHasToken,
} from "@/lib/onboarding/verify-domain";
import { isRepoName, parseWebsite } from "@/lib/onboarding/website";

export class OnboardingError extends Error {
  draft?: OnboardingDraft;

  constructor(message: string, draft?: OnboardingDraft) {
    super(message);
    this.draft = draft;
  }
}

function newToken() {
  return `ff_${randomBytes(16).toString("hex")}`;
}

function laterStep(current: ProjectStep, next: ProjectStep) {
  return projectSteps.indexOf(next) > projectSteps.indexOf(current)
    ? next
    : current;
}

type StoredProject = { id: string } & ProjectRecord;

function readProject(
  id: string,
  data: FirebaseFirestore.DocumentData,
): StoredProject {
  return { id, ...(data as ProjectRecord) };
}

async function ownedProject(userId: string) {
  const project = await getOrCreateProject(userId);
  if (project.userId !== userId) {
    throw new OnboardingError("Project not found.");
  }
  if (project.onboarding.status === OnboardingStatus.complete) {
    throw new OnboardingError(
      "This project is already set up.",
      toOnboardingDraft(project),
    );
  }
  return project;
}

export async function getOrCreateProject(userId: string) {
  const userRef = db().collection("users").doc(userId);
  const newRef = db().collection("projects").doc();

  const id = await db().runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    if (!user.exists) throw new OnboardingError("Account not found.");

    const existingId = user.get("onboarding.projectId");
    if (typeof existingId === "string" && existingId) return existingId;

    tx.set(newRef, {
      userId,
      url: null,
      domain: null,
      ownership: {
        status: "pending",
        method: null,
        token: newToken(),
        verifiedAt: null,
      },
      analyticsProvider: null,
      repoFullName: null,
      goal: null,
      onboarding: {
        status: OnboardingStatus.in_progress,
        step: "site",
        completedAt: null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    } satisfies ProjectRecord);
    tx.update(userRef, {
      onboarding: {
        status: OnboardingStatus.in_progress,
        projectId: newRef.id,
        completedAt: null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return newRef.id;
  });

  const snap = await db().collection("projects").doc(id).get();
  if (!snap.exists) throw new OnboardingError("Project not found.");
  return readProject(id, snap.data() ?? {});
}

async function writeProject(
  project: StoredProject,
  patch: Record<string, unknown>,
) {
  await db()
    .collection("projects")
    .doc(project.id)
    .update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    });
  const snap = await db().collection("projects").doc(project.id).get();
  return toOnboardingDraft(readProject(project.id, snap.data() ?? {}));
}

export async function saveProjectSite(
  userId: string,
  url: string,
  method: OwnershipMethod,
) {
  const parsed = parseWebsite(url);
  if (!parsed) {
    throw new OnboardingError("Enter a valid website address, like acme.so.");
  }

  const project = await ownedProject(userId);
  const domainChanged =
    project.domain !== null && project.domain !== parsed.domain;
  const verified = !domainChanged && project.ownership.status === "verified";

  return writeProject(project, {
    url: parsed.origin,
    domain: parsed.domain,
    ownership: {
      status: verified ? "verified" : "pending",
      method,
      token: domainChanged ? newToken() : project.ownership.token,
      verifiedAt: verified ? project.ownership.verifiedAt : null,
    },
    "onboarding.step": domainChanged
      ? "verify"
      : laterStep(project.onboarding.step, "verify"),
    "onboarding.status": OnboardingStatus.in_progress,
  });
}

export async function verifyProjectDomain(
  userId: string,
  url: string,
  method: OwnershipMethod,
) {
  const parsed = parseWebsite(url);
  if (!parsed) {
    throw new OnboardingError("Enter a valid website address, like acme.so.");
  }

  const project = await ownedProject(userId);
  if (project.domain !== parsed.domain) {
    const draft = await saveProjectSite(userId, url, method);
    throw new OnboardingError(
      "Add this token to your site, then check again.",
      draft,
    );
  }

  try {
    await assertPublicDomain(parsed.domain);
  } catch (error) {
    throw new OnboardingError(
      error instanceof Error ? error.message : "That domain can't be checked.",
      { ...toOnboardingDraft(project), method },
    );
  }
  const found =
    method === "dns"
      ? await dnsHasToken(parsed.domain, project.ownership.token)
      : await fileHasToken(parsed.domain, project.ownership.token);

  if (!found) {
    throw new OnboardingError(
      method === "dns"
        ? "We couldn't find that TXT record yet. DNS can take a few minutes."
        : "We couldn't find that file yet. Check the URL and the token.",
      { ...toOnboardingDraft(project), method },
    );
  }

  return writeProject(project, {
    ownership: {
      status: "verified",
      method,
      token: project.ownership.token,
      verifiedAt: FieldValue.serverTimestamp(),
    },
    "onboarding.step": laterStep(project.onboarding.step, "analytics"),
    "onboarding.status": OnboardingStatus.in_progress,
  });
}

export async function saveProjectAnalytics(
  userId: string,
  provider: AnalyticsProvider,
) {
  if (!analyticsProviders.includes(provider)) {
    throw new OnboardingError("Choose an analytics platform.");
  }
  const project = await ownedProject(userId);
  if (project.ownership.status !== "verified") {
    throw new OnboardingError(
      "Verify that you own this domain before continuing.",
      toOnboardingDraft(project),
    );
  }

  return writeProject(project, {
    analyticsProvider: provider,
    "onboarding.step": laterStep(project.onboarding.step, "github"),
  });
}

export async function saveProjectRepo(userId: string, repo: string) {
  const fullName = repo.trim();
  if (!isRepoName(fullName)) {
    throw new OnboardingError("Enter a repository as owner/repository.");
  }
  const project = await ownedProject(userId);
  if (!project.analyticsProvider) {
    throw new OnboardingError(
      "Choose an analytics platform before continuing.",
      toOnboardingDraft(project),
    );
  }

  return writeProject(project, {
    repoFullName: fullName,
    "onboarding.step": laterStep(project.onboarding.step, "goal"),
  });
}

export async function completeProject(userId: string, goal: ProjectGoal) {
  if (!projectGoals.includes(goal)) {
    throw new OnboardingError("Choose a goal.");
  }
  const project = await ownedProject(userId);
  if (!project.repoFullName) {
    throw new OnboardingError(
      "Add a repository before continuing.",
      toOnboardingDraft(project),
    );
  }

  const draft = await writeProject(project, {
    goal,
    "onboarding.status": OnboardingStatus.complete,
    "onboarding.step": "done",
    "onboarding.completedAt": FieldValue.serverTimestamp(),
  });

  await db().collection("users").doc(userId).update({
    "onboarding.status": OnboardingStatus.complete,
    "onboarding.completedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ...draft, complete: true, step: "done" as const };
}
