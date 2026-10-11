import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { githubInstallUrl } from "@/lib/github/config";
import {
  createGithubState,
  GITHUB_STATE_COOKIE,
  githubStateCookieOptions,
} from "@/lib/github/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getServerUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth?redirect=/onboarding", origin));
  }

  try {
    const state = createGithubState(user.userId);
    const response = NextResponse.redirect(githubInstallUrl(state));
    response.cookies.set(GITHUB_STATE_COOKIE, state, githubStateCookieOptions());
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub could not be opened.";
    return redirectToConnected(origin, message);
  }
}

function redirectToConnected(origin: string, error: string) {
  const url = new URL("/onboarding/github/connected", origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
