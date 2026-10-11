import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/db/firebase";
import { COLLECTIONS } from "@/lib/db/collections";
import type { GithubInstallationRecord } from "@/lib/db/schema/github-installation";

export async function getGithubInstallation(userId: string) {
  const snap = await db()
    .collection(COLLECTIONS.GITHUB_INSTALLATIONS)
    .doc(userId)
    .get();

  if (!snap.exists) return null;

  const data = snap.data();
  if (!data) return null;

  const installationId = Number(data.installationId);
  if (!Number.isInteger(installationId) || installationId <= 0) return null;

  const record: GithubInstallationRecord = {
    userId,
    installationId,
    accountLogin: typeof data.accountLogin === "string" ? data.accountLogin : "",
    accountType: typeof data.accountType === "string" ? data.accountType : "User",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  return record;
}

export async function saveGithubInstallation(input: {
  userId: string;
  installationId: number;
  accountLogin: string;
  accountType: string;
}) {
  const ref = db().collection(COLLECTIONS.GITHUB_INSTALLATIONS).doc(input.userId);
  const snap = await ref.get();

  await ref.set({
    userId: input.userId,
    installationId: input.installationId,
    accountLogin: input.accountLogin,
    accountType: input.accountType,
    createdAt: snap.exists
      ? (snap.get("createdAt") ?? FieldValue.serverTimestamp())
      : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteGithubInstallation(userId: string) {
  await db().collection(COLLECTIONS.GITHUB_INSTALLATIONS).doc(userId).delete();
}
