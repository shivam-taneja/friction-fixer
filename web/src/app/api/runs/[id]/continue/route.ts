import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import { getUserProfile } from "@/lib/db/users";
import { PROJECT_DISCONNECTED, continueAgent, getRun, RunRejected } from "@/lib/db/runs";
import { OnboardingStatus } from "@/lib/db/schema/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const run = await getRun(user.userId, id);
  if (!run) {
    return NextResponse.json(
      { error: "That run was not found." },
      { status: 404 },
    );
  }
  if (run.status !== "blocked") {
    return NextResponse.json(
      { error: "This run is not waiting for you." },
      { status: 409 },
    );
  }

  const profile = await getUserProfile(user.userId);
  const projectId = profile?.onboarding.projectId;
  if (
    profile?.onboarding.status !== OnboardingStatus.complete ||
    run.projectId !== projectId
  ) {
    return NextResponse.json({ error: PROJECT_DISCONNECTED }, { status: 409 });
  }

  try {
    await continueAgent({ runId: id, userId: user.userId });
    return NextResponse.json({ id }, { status: 202 });
  } catch (error) {
    if (error instanceof RunRejected) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not continue the run.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
