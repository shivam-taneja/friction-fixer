import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  CONNECT_TOGETHER,
  getUserProfile,
  setupComplete,
} from "@/lib/db/users";
import {
  posthogAuthorizeUrl,
  posthogRedirectAllowed,
  posthogRedirectUri,
} from "@/lib/posthog/config";
import { codeChallenge, createCodeVerifier } from "@/lib/posthog/pkce";
import {
  createPosthogState,
  POSTHOG_STATE_COOKIE,
  posthogStateCookieOptions,
} from "@/lib/posthog/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getServerUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth?redirect=/onboarding", origin));
  }
  const profile = await getUserProfile(user.userId);
  if (setupComplete(profile)) {
    return finish(origin, CONNECT_TOGETHER);
  }
  if (!posthogRedirectAllowed(origin)) {
    return finish(
      origin,
      "Open Friction Fixer on its public site, or on localhost:3000, before connecting PostHog.",
    );
  }

  try {
    const verifier = createCodeVerifier();
    const redirectUri = posthogRedirectUri(origin);
    const state = createPosthogState(user.userId, verifier, redirectUri);
    const response = NextResponse.redirect(
      posthogAuthorizeUrl({
        redirectUri,
        state,
        codeChallenge: codeChallenge(verifier),
      }),
    );
    response.cookies.set(
      POSTHOG_STATE_COOKIE,
      state,
      posthogStateCookieOptions(),
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PostHog could not be opened.";
    return finish(origin, message);
  }
}

function finish(origin: string, error: string) {
  const url = new URL("/onboarding/posthog/connected", origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
