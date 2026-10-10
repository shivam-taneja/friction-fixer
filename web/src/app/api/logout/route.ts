import { authConfig } from "@/lib/firebase/auth-config";
import { NextResponse } from "next/server";

export async function GET() {
  const response = new NextResponse(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  response.cookies.set(authConfig.cookieName, "", {
    ...authConfig.cookieSerializeOptions,
    maxAge: 0,
  });

  response.cookies.set(`${authConfig.cookieName}-refresh`, "", {
    ...authConfig.cookieSerializeOptions,
    maxAge: 0,
  });

  return response;
}
