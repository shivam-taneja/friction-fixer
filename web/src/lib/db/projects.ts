import { FieldValue } from "firebase-admin/firestore";
import type { AnalyticsProvider, ProjectGoal } from "@/components/onboarding/logic";
import { db } from "@/lib/db/firebase";
import { COLLECTIONS } from "@/lib/db/collections";
import { OnboardingStatus } from "@/lib/db/schema/user";

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
  const projectRef = firestore.collection(COLLECTIONS.PROJECTS).doc();
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(input.userId);
  const batch = firestore.batch();

  batch.set(projectRef, {
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

  batch.update(userRef, {
    "onboarding.status": OnboardingStatus.in_progress,
    "onboarding.projectId": projectRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return projectRef.id;
}
