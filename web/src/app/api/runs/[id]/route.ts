import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { getRun } from "@/lib/db/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { id } = await context.params;
  const run = await getRun(user.userId, id);
  if (!run) {
    return NextResponse.json({ error: "That run was not found." }, { status: 404 });
  }

  return NextResponse.json({ run });
}
