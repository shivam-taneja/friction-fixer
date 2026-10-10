import { clearSession } from "@/lib/auth/session";
import { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return clearSession(request);
}
