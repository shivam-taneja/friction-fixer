import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "next-firebase-auth-edge";
import { authConfig } from "./lib/firebase/auth-config";
import {
  PUBLIC_PATHS,
  AUTH_API_PATHS,
  LOGIN_PATH,
  DEFAULT_LOGIN_REDIRECT,
  redirectToLogin,
} from "./config/routes";

export async function proxy(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: AUTH_API_PATHS.login,
    logoutPath: AUTH_API_PATHS.logout,
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    serviceAccount: authConfig.serviceAccount,
    handleValidToken: async ({}, headers) => {
      if (
        PUBLIC_PATHS.includes(request.nextUrl.pathname) &&
        request.nextUrl.pathname === LOGIN_PATH
      ) {
        return NextResponse.redirect(
          new URL(DEFAULT_LOGIN_REDIRECT, request.url),
        );
      }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    },
    handleInvalidToken: async (reason) => {
      console.error("[auth] Invalid token:", {
        pathname: request.nextUrl.pathname,
        reason,
      });

      if (!PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        console.info("Missing or invalid credentials", { reason });
      }

      return redirectToLogin(request);
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });

      return redirectToLogin(request);
    },
  });
}

export const config = {
  matcher: [
    "/",
    "/((?!_next|favicon.ico|api|.*\\.).*)",
    "/api/login",
    "/api/logout",
  ],
};
