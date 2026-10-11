import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  deleteInstallation,
  GithubRequestError,
  listInstallationRepos,
} from "@/lib/github/app";
import {
  deleteGithubInstallation,
  getGithubInstallation,
} from "@/lib/db/github-installations";
import type { GithubConnection } from "@/lib/github/types";

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

  try {
    const installation = await getGithubInstallation(user.userId);
    if (!installation) {
      const body: GithubConnection = { connected: false };
      return NextResponse.json(body);
    }

    const repos = await listInstallationRepos(installation.installationId);
    const body: GithubConnection = {
      connected: true,
      installationId: installation.installationId,
      accountLogin: installation.accountLogin,
      repos,
    };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof GithubRequestError && error.status === 404) {
      await deleteGithubInstallation(user.userId);
      const body: GithubConnection = { connected: false };
      return NextResponse.json(body);
    }

    const message =
      error instanceof Error ? error.message : "Could not load GitHub.";
    const status = error instanceof GithubRequestError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }

  try {
    const installation = await getGithubInstallation(user.userId);
    if (installation) {
      await deleteInstallation(installation.installationId);
      await deleteGithubInstallation(user.userId);
    }

    const body: GithubConnection = { connected: false };
    return NextResponse.json(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect GitHub.";
    const status = error instanceof GithubRequestError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
