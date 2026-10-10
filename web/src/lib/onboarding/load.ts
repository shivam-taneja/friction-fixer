import { requestUser } from "@/lib/auth/request-user";
import { getOrCreateProject } from "@/lib/db/projects";
import { toOnboardingDraft } from "@/lib/onboarding/draft";

export async function loadOnboardingDraft() {
  const user = await requestUser();
  if (!user) return null;

  try {
    const project = await getOrCreateProject(user.userId);
    return toOnboardingDraft(project);
  } catch (error) {
    console.error("Couldn't load onboarding", error);
    return null;
  }
}
