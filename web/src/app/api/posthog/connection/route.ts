import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  deletePosthogConnection,
  getPosthogConnection,
  posthogStatus,
} from "@/lib/db/posthog-connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }
  const record = await getPosthogConnection(user.userId);
  return NextResponse.json(posthogStatus(record));
}

export async function DELETE() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }
  await deletePosthogConnection(user.userId);
  return NextResponse.json({ connected: false });
}
