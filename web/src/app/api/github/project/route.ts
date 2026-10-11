import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { getGithubInstallation } from "@/lib/db/github-installations";
import { GithubRequestError, inspectRepository } from "@/lib/github/app";
import { describeProject } from "@/lib/github/framework";
import { parseRepoFullName } from "@/lib/github/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const url = new URL(request.url);
  const fullName = url.searchParams.get("repo") ?? "";
  const branch = url.searchParams.get("branch") ?? "";
  if (!parseRepoFullName(fullName) || !branch) {
    return NextResponse.json(
      { error: "Choose a repository and branch." },
      { status: 400 },
    );
  }

  try {
    const installation = await getGithubInstallation(user.userId);
    if (!installation) {
      return NextResponse.json(
        { error: "Connect GitHub before detecting the project." },
        { status: 409 },
      );
    }

    const inspected = await inspectRepository({
      installationId: installation.installationId,
      fullName,
      branch,
    });
    return NextResponse.json(
      describeProject(
        inspected.paths,
        inspected.dependencies,
        inspected.folders,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not read the project.";
    const status = error instanceof GithubRequestError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
