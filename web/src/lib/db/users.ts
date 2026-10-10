import { FieldValue } from "firebase-admin/firestore";
import type { AuthProviderName } from "@/lib/db/schema";
import { db } from "@/lib/db/firebase";

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
  const id = userDocId(input.email, input.provider, input.accountId);
  const ref = db().collection("users").doc(id);
  const snap = await ref.get();
  const providerLink = { accountId: input.accountId };

  if (!snap.exists) {
    await ref.set({
      email: input.email?.trim().toLowerCase() ?? null,
      name: input.name ?? null,
      image: input.image ?? null,
      providers: { [input.provider]: providerLink },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      onboarding: {
        status: "not_started",
        step: "site",
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
}
