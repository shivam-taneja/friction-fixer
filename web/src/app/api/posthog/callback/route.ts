import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { savePosthogConnection } from "@/lib/db/posthog-connections";
import { exchangePosthogCode, findPosthogProject } from "@/lib/posthog/oauth";
import { readRequestCookie } from "@/lib/github/state";
import {
  POSTHOG_STATE_COOKIE,
  posthogStateCookieOptions,
  readPosthogState,
} from "@/lib/posthog/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL(request.url);
  const user = await getServerUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth?redirect=/onboarding", origin));
  }

  const denied =
    url.searchParams.get("error_description") || url.searchParams.get("error");
  if (denied) {
    return finish(origin, denied);
  }

  const state = url.searchParams.get("state") ?? "";
  const cookie = readRequestCookie(request, POSTHOG_STATE_COOKIE);
  const saved =
    state && state === cookie ? readPosthogState(state, user.userId) : null;
  if (!saved) {
    return finish(origin, "PostHog connection expired. Try connecting again.");
  }

  const code = url.searchParams.get("code") ?? "";
  if (!code) {
    return finish(origin, "PostHog did not return an authorization code.");
  }

  try {
    const tokens = await exchangePosthogCode({
      code,
      redirectUri: saved.redirectUri,
      verifier: saved.verifier,
    });
    const project = await findPosthogProject(tokens.accessToken);
    await savePosthogConnection({
      userId: user.userId,
      projectId: project.projectId,
      projectName: project.projectName,
      apiHost: project.apiHost,
      refreshToken: tokens.refreshToken,
    });
    return finish(origin);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save the PostHog connection.";
    return finish(origin, message);
  }
}

function finish(origin: string, error?: string) {
  const url = new URL("/onboarding/posthog/connected", origin);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set(POSTHOG_STATE_COOKIE, "", {
    ...posthogStateCookieOptions(),
    maxAge: 0,
  });
  return response;
}
