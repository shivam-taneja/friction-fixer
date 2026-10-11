import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/db/collections";
import { db } from "@/lib/db/firebase";
import type {
  PosthogConnectionRecord,
  PosthogConnectionStatus,
} from "@/lib/db/schema/posthog-connection";

export async function getPosthogConnection(userId: string) {
  const snap = await db()
    .collection(COLLECTIONS.POSTHOG_CONNECTIONS)
    .doc(userId)
    .get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  const projectId = text(data.projectId);
  const apiHost = text(data.apiHost);
  const refreshToken = text(data.refreshToken);
  if (!projectId || !apiHost || !refreshToken) return null;
  const record: PosthogConnectionRecord = {
    userId,
    projectId,
    projectName: text(data.projectName) || "PostHog project",
    apiHost,
    refreshToken,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  return record;
}

export function posthogStatus(
  record: PosthogConnectionRecord | null,
): PosthogConnectionStatus {
  if (!record) return { connected: false };
  return {
    connected: true,
    projectId: record.projectId,
    projectName: record.projectName,
    apiHost: record.apiHost,
  };
}

export async function savePosthogConnection(input: {
  userId: string;
  projectId: string;
  projectName: string;
  apiHost: string;
  refreshToken: string;
}) {
  const ref = db()
    .collection(COLLECTIONS.POSTHOG_CONNECTIONS)
    .doc(input.userId);
  const snap = await ref.get();
  await ref.set({
    userId: input.userId,
    projectId: input.projectId,
    projectName: input.projectName,
    apiHost: input.apiHost,
    refreshToken: input.refreshToken,
    createdAt: snap.exists
      ? (snap.get("createdAt") ?? FieldValue.serverTimestamp())
      : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deletePosthogConnection(userId: string) {
  await db().collection(COLLECTIONS.POSTHOG_CONNECTIONS).doc(userId).delete();
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
