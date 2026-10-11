import { upsertUser } from "@/lib/db/users";
import { authConfig } from "@/lib/firebase/auth-config";
import { signInIdentity } from "@/lib/auth/identity";
import { getFirebaseAuth } from "next-firebase-auth-edge/auth";
import {
  removeAuthCookies,
  setAuthCookies,
} from "next-firebase-auth-edge/next/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function createSession(request: NextRequest) {
  const header = request.headers.get("Authorization");
  const token = header?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  try {
    const { verifyIdToken } = getFirebaseAuth(
      authConfig.serviceAccount,
      authConfig.apiKey,
    );

    const decoded = await verifyIdToken(token);

    const identity = signInIdentity(decoded);

    if (!identity) {
      return NextResponse.json(
        { error: "Unsupported sign-in provider" },
        { status: 401 },
      );
    }

    await upsertUser(identity);
    const response = setAuthCookies(request.headers, authConfig);
    return response;
  } catch (error) {
    console.error("[createSession] Login failed:", error);

    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export function clearSession(request: NextRequest) {
  return removeAuthCookies(request.headers, {
    cookieName: authConfig.cookieName,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
  });
}
