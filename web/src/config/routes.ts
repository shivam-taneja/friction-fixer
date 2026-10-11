import { NextRequest, NextResponse } from "next/server";

/**
 * These routes do not require authentication.
 */
export const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/privacy",
  "/terms",
  "/api/login",
  "/api/logout",
];

/**
 * These are the login and logout paths used by Next.js Firebase Auth Edge.
 */
export const AUTH_API_PATHS = {
  login: "/api/login",
  logout: "/api/logout",
};

/**
 * The default path to redirect unauthenticated users to.
 */
export const LOGIN_PATH = "/auth";

/**
 * The default path to redirect authenticated users to after login.
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export function redirectToLogin(request: NextRequest) {
  console.trace("[redirectToLogin]", {
    pathname: request.nextUrl.pathname,
  });

  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
