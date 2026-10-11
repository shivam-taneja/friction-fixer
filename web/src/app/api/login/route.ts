import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  return createSession(request);
}
