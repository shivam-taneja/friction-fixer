import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/db/firebase";
import {
  OnboardingStatus,
  savedCheckAfterHours,
  UserRecord,
  type AuthProviderName,
} from "@/lib/db/schema/user";
import { COLLECTIONS } from "./collections";

export function userDocId(
  email: string | null | undefined,
  provider: string,
  accountId: string,
) {
  const normalized = email?.trim().toLowerCase();
  if (normalized) return normalized;
  return `${provider}:${accountId}`;
}

export async function upsertUser(input: {
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
  provider: AuthProviderName;
  accountId: string;
}) {
  try {
    const id = userDocId(input.email, input.provider, input.accountId);
    const ref = db().collection(COLLECTIONS.USERS).doc(id);

    const snap = await ref.get();

    const existing = snap.get(`providers.${input.provider}`) as
      | { connectedAt?: unknown }
      | undefined;

    const providerLink = {
      accountId: input.accountId,
      connectedAt: existing?.connectedAt ?? FieldValue.serverTimestamp(),
    };

    if (!snap.exists) {
      await ref.set({
        email: input.email?.trim().toLowerCase() ?? null,
        name: input.name ?? null,
        image: input.image ?? null,
        providers: { [input.provider]: providerLink },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        onboarding: {
          status: OnboardingStatus.not_started,
          projectId: null,
          completedAt: null,
        },
      });

      return id;
    }

    await ref.update({
      email: input.email?.trim().toLowerCase() ?? snap.get("email") ?? null,
      name: input.name ?? snap.get("name") ?? null,
      image: input.image ?? snap.get("image") ?? null,
      [`providers.${input.provider}`]: providerLink,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return id;
  } catch (error) {
    console.error("[upsertUser] Failed", {
      provider: input.provider,
      error,
    });

    throw error;
  }
}

export const CONNECT_TOGETHER =
  "GitHub and PostHog connect together during setup.";

export const DISCONNECT_TOGETHER =
  "GitHub and PostHog disconnect together from Settings.";

export function setupComplete(
  profile: Pick<UserRecord, "onboarding"> | null | undefined,
) {
  const projectId = profile?.onboarding.projectId;
  return (
    profile?.onboarding.status === OnboardingStatus.complete &&
    typeof projectId === "string" &&
    projectId.length > 0
  );
}

export async function getUserProfile(uid: string): Promise<UserRecord | null> {
  const snap = await db().collection(COLLECTIONS.USERS).doc(uid).get();

  if (!snap.exists) return null;

  const data = snap.data() as Partial<UserRecord>;

  if (!data) return null;

  return {
    email: data.email ?? null,
    name: data.name ?? null,
    image: data.image ?? null,
    providers: data.providers ?? {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    onboarding: data.onboarding ?? {
      status: OnboardingStatus.not_started,
      projectId: null,
      completedAt: null,
    },
    useMockData: data.useMockData === true,
    checkAfterHours: savedCheckAfterHours(data.checkAfterHours),
  };
}

export async function setCheckAfterHours(userId: string, hours: number) {
  await db().collection(COLLECTIONS.USERS).doc(userId).update({
    checkAfterHours: hours,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function setUseMockData(userId: string, enabled: boolean) {
  await db().collection(COLLECTIONS.USERS).doc(userId).update({
    useMockData: enabled,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
