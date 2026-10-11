import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  console.log("[api/auth/session] Handler reached");
  return createSession(request);
}
