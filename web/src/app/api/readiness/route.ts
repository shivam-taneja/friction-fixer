import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { readReady, RunRejected } from "@/lib/db/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  try {
    return NextResponse.json(await readReady(user.userId));
  } catch (error) {
    const message =
      error instanceof RunRejected
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not check whether this project has a baseline.";
    const status = error instanceof RunRejected ? error.status : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
