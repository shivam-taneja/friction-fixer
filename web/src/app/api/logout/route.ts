import { NextRequest } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  return clearSession(request);
}
