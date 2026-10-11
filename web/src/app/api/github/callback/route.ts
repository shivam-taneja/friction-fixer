import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { getInstallationAccount } from "@/lib/github/app";
import { saveGithubInstallation } from "@/lib/db/github-installations";
import {
  GITHUB_STATE_COOKIE,
  githubStateCookieOptions,
  readGithubState,
  readRequestCookie,
} from "@/lib/github/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL(request.url);
  const user = await getServerUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth?redirect=/onboarding", origin));
  }

  const setupAction = url.searchParams.get("setup_action");
  if (setupAction === "request") {
    return finish(
      origin,
      "Ask a GitHub owner to approve the Friction Fixer app.",
    );
  }

  const state = url.searchParams.get("state") ?? "";
  const cookie = readRequestCookie(request, GITHUB_STATE_COOKIE);
  if (!state || state !== cookie || !readGithubState(state, user.userId)) {
    return finish(origin, "GitHub connection expired. Try connecting again.");
  }

  const installationId = Number(url.searchParams.get("installation_id"));
  if (!Number.isInteger(installationId) || installationId <= 0) {
    return finish(origin, "GitHub did not return an installation.");
  }

  try {
    const account = await getInstallationAccount(installationId);
    if (!account) {
      return finish(
        origin,
        "GitHub did not return an account for that install.",
      );
    }

    await saveGithubInstallation({
      userId: user.userId,
      installationId,
      accountLogin: account.login,
      accountType: account.type,
    });

    return finish(origin);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save the GitHub install.";
    return finish(origin, message);
  }
}

function finish(origin: string, error?: string) {
  const url = new URL("/onboarding/github/connected", origin);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set(GITHUB_STATE_COOKIE, "", {
    ...githubStateCookieOptions(),
    maxAge: 0,
  });
  return response;
}
