import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { GithubRequestError, listBranches } from "@/lib/github/app";
import { getGithubInstallation } from "@/lib/db/github-installations";
import { parseRepoFullName } from "@/lib/github/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const fullName = new URL(request.url).searchParams.get("repo") ?? "";
  if (!parseRepoFullName(fullName)) {
    return NextResponse.json(
      { error: "Choose a repository." },
      { status: 400 },
    );
  }

  try {
    const installation = await getGithubInstallation(user.userId);
    if (!installation) {
      return NextResponse.json(
        { error: "Connect GitHub before choosing a branch." },
        { status: 409 },
      );
    }

    const branches = await listBranches(installation.installationId, fullName);
    return NextResponse.json({ branches });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load branches.";
    const status = error instanceof GithubRequestError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
