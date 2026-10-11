"use server";

import { getServerUser } from "@/lib/auth/request-user";
import {
  analyticsChoices,
  parseProjectGoal,
  type AnalyticsProvider,
  type ProjectGoal,
} from "@/components/onboarding/logic";
import { getGithubInstallation } from "@/lib/db/github-installations";
import { getPosthogConnection } from "@/lib/db/posthog-connections";
import { createProject } from "@/lib/db/projects";
import {
  assertRepoBranch,
  assertRepoFolder,
  GithubRequestError,
} from "@/lib/github/app";
import { isGithubSelection, type GithubSelection } from "@/lib/github/types";

export async function finishOnboarding(input: {
  analytics: AnalyticsProvider;
  github: GithubSelection;
  goal: ProjectGoal;
}) {
  const user = await getServerUser();

  if (!user) {
    throw new Error("Sign in to continue.");
  }

  const provider = analyticsChoices.find(
    (choice) => choice.id === input.analytics,
  );
  if (!provider?.available) {
    throw new Error(
      "PostHog is the analytics provider you can connect right now.",
    );
  }
  if (!(await getPosthogConnection(user.userId))) {
    throw new Error("Connect PostHog before continuing.");
  }

  const parsedGoal = await parseProjectGoal(input.goal);
  if (!parsedGoal.ok) throw new Error(parsedGoal.error);

  if (!isGithubSelection(input.github)) {
    throw new Error("Choose a repository, branch, and source folder.");
  }

  const installation = await getGithubInstallation(user.userId);
  if (
    !installation ||
    installation.installationId !== input.github.installationId
  ) {
    throw new Error("Connect GitHub again before continuing.");
  }

  try {
    await assertRepoBranch({
      installationId: installation.installationId,
      fullName: input.github.fullName,
      branch: input.github.branch,
    });

    await assertRepoFolder({
      installationId: installation.installationId,
      fullName: input.github.fullName,
      branch: input.github.branch,
      path: input.github.sourceFolder ?? "",
    });
  } catch (error) {
    if (error instanceof GithubRequestError && error.status === 404) {
      throw new Error(
        "That repository, branch, or source folder is not available to the GitHub App.",
      );
    }
    throw error instanceof Error
      ? error
      : new Error("Could not check the repository.");
  }

  await createProject({
    userId: user.userId,
    analyticsProvider: input.analytics,
    goal: parsedGoal.goal,
    repository: input.github.fullName,
    branch: input.github.branch,
    framework: input.github.framework ?? "",
    sourceFolder: input.github.sourceFolder ?? "",
    installationId: installation.installationId,
    accountLogin: installation.accountLogin,
  });
}
