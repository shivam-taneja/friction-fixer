import type {
  OnboardingAction,
  OnboardingDraft,
} from "@/lib/onboarding/draft";

export async function postOnboarding(body: OnboardingAction) {
  const response = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: { draft?: OnboardingDraft; error?: string } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.draft) {
    const error = new Error(
      payload.error ?? "Couldn't save your progress.",
    ) as Error & { draft?: OnboardingDraft };
    error.draft = payload.draft;
    throw error;
  }

  return payload.draft;
}
