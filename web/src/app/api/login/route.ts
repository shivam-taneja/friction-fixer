import { authConfig } from "@/lib/firebase/auth-config";
import { getFirebaseAuth } from "next-firebase-auth-edge/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const token = auth?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const { getCustomIdAndRefreshTokens } = getFirebaseAuth(
    authConfig.serviceAccount,
    authConfig.apiKey,
  );

  try {
    const { idToken, refreshToken } = await getCustomIdAndRefreshTokens(token);

    const response = new NextResponse(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    response.cookies.set(authConfig.cookieName, idToken, {
      ...authConfig.cookieSerializeOptions,
    });

    if (refreshToken) {
      response.cookies.set(`${authConfig.cookieName}-refresh`, refreshToken, {
        ...authConfig.cookieSerializeOptions,
      });
    }

    return response;
  } catch (e) {
    console.error("Login failed: ", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
