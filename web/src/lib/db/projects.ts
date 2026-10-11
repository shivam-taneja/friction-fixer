import { FieldValue } from "firebase-admin/firestore";
import type {
  AnalyticsProvider,
  ProjectGoal,
} from "@/components/onboarding/logic";
import { db } from "@/lib/db/firebase";
import { COLLECTIONS } from "@/lib/db/collections";
import { OnboardingStatus } from "@/lib/db/schema/user";
import type { ProjectRecord } from "@/lib/db/schema/project";

export async function createProject(input: {
  userId: string;
  analyticsProvider: AnalyticsProvider;
  goal: ProjectGoal;
  repository: string;
  branch: string;
  framework: string;
  sourceFolder: string;
  installationId: number;
  accountLogin: string;
}) {
  const firestore = db();
  const existing = await firestore
    .collection(COLLECTIONS.PROJECTS)
    .where("userId", "==", input.userId)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error("You already have a project.");
  }

  const projectRef = firestore.collection(COLLECTIONS.PROJECTS).doc();
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(input.userId);

  await firestore.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const status = userSnap.get("onboarding.status");
    const projectId = userSnap.get("onboarding.projectId");
    if (
      status === OnboardingStatus.complete ||
      (typeof projectId === "string" && projectId.length > 0)
    ) {
      throw new Error("You already have a project.");
    }

    transaction.set(projectRef, {
      userId: input.userId,
      analyticsProvider: input.analyticsProvider,
      goal: input.goal,
      repository: input.repository,
      branch: input.branch,
      framework: input.framework,
      sourceFolder: input.sourceFolder,
      installationId: input.installationId,
      accountLogin: input.accountLogin,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(userRef, {
      "onboarding.status": OnboardingStatus.complete,
      "onboarding.projectId": projectRef.id,
      "onboarding.completedAt": FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return projectRef.id;
}

export async function deleteUserProject(userId: string) {
  const firestore = db();
  const projects = await firestore
    .collection(COLLECTIONS.PROJECTS)
    .where("userId", "==", userId)
    .get();
  const batch = firestore.batch();

  for (const project of projects.docs) {
    batch.delete(project.ref);
  }

  batch.update(firestore.collection(COLLECTIONS.USERS).doc(userId), {
    "onboarding.status": OnboardingStatus.not_started,
    "onboarding.projectId": null,
    "onboarding.completedAt": null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

export async function getProject(projectId: string) {
  const snap = await db().collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data || typeof data.repository !== "string") return null;

  const project: Pick<
    ProjectRecord,
    | "analyticsProvider"
    | "goal"
    | "repository"
    | "branch"
    | "framework"
    | "sourceFolder"
    | "accountLogin"
  > = {
    analyticsProvider: data.analyticsProvider,
    goal: typeof data.goal === "string" ? data.goal : "",
    repository: data.repository,
    branch: typeof data.branch === "string" ? data.branch : "",
    framework: typeof data.framework === "string" ? data.framework : "",
    sourceFolder: typeof data.sourceFolder === "string" ? data.sourceFolder : "",
    accountLogin: typeof data.accountLogin === "string" ? data.accountLogin : "",
  };

  return project;
}
