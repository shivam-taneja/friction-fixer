"use server";

import { getServerUser } from "@/lib/auth/request-user";
import { markOnboardingInProgress } from "@/lib/db/users";

export async function finishOnboarding() {
  const user = await getServerUser();

  if (!user) {
    throw new Error("Sign in to continue.");
  }

  await markOnboardingInProgress(user.userId);
}
