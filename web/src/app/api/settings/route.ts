import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  deleteGithubInstallation,
  getGithubInstallation,
} from "@/lib/db/github-installations";
import { deleteUserProject, getProject } from "@/lib/db/projects";
import { stopProjectRuns } from "@/lib/db/runs";
import { OnboardingStatus } from "@/lib/db/schema/user";
import { deletePosthogConnection } from "@/lib/db/posthog-connections";
import { getUserProfile, setUseMockData } from "@/lib/db/users";
import { deleteInstallation, GithubRequestError } from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const profile = await getUserProfile(user.userId);
  const projectId = profile?.onboarding.projectId;
  const complete =
    profile?.onboarding.status === OnboardingStatus.complete &&
    typeof projectId === "string" &&
    projectId.length > 0;

  if (!complete || !projectId) {
    return NextResponse.json({ status: OnboardingStatus.not_started });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ status: OnboardingStatus.not_started });
  }

  return NextResponse.json({
    status: OnboardingStatus.complete,
    project: { id: projectId, ...project },
    useMockData: profile.useMockData === true,
  });
}

export async function PATCH(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    useMockData?: unknown;
  } | null;
  if (!body || typeof body.useMockData !== "boolean") {
    return NextResponse.json(
      { error: "Choose whether mock data is on." },
      { status: 400 },
    );
  }

  await setUseMockData(user.userId, body.useMockData);
  return NextResponse.json({ useMockData: body.useMockData });
}

export async function DELETE(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    repository?: unknown;
  };
  const profile = await getUserProfile(user.userId);
  const projectId = profile?.onboarding.projectId;
  const project =
    typeof projectId === "string" && projectId.length > 0
      ? await getProject(projectId)
      : null;

  if (
    typeof projectId !== "string" ||
    !project ||
    body.repository !== project.repository
  ) {
    return NextResponse.json(
      { error: "Type the repository name to confirm." },
      { status: 400 },
    );
  }

  try {
    await stopProjectRuns(user.userId, projectId);
    await deletePosthogConnection(user.userId);
    const installation = await getGithubInstallation(user.userId);
    if (installation) {
      await deleteInstallation(installation.installationId);
      await deleteGithubInstallation(user.userId);
    }

    await deleteUserProject(user.userId);
    return NextResponse.json({ status: OnboardingStatus.not_started });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not remove the connection.";
    const status = error instanceof GithubRequestError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
