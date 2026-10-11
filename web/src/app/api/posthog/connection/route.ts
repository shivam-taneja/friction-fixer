import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  deletePosthogConnection,
  getPosthogConnection,
  posthogStatus,
} from "@/lib/db/posthog-connections";
import {
  DISCONNECT_TOGETHER,
  getUserProfile,
  setupComplete,
} from "@/lib/db/users";

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
  const profile = await getUserProfile(user.userId);
  if (setupComplete(profile)) {
    return NextResponse.json({ error: DISCONNECT_TOGETHER }, { status: 409 });
  }
  await deletePosthogConnection(user.userId);
  return NextResponse.json({ connected: false });
}
