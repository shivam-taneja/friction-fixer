import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  assertCapacity,
  createRun,
  failRun,
  listRuns,
  RunRejected,
  startAgent,
} from "@/lib/db/runs";
import { isRunCase } from "@/lib/db/schema/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const runs = await listRuns(user.userId);
  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const runCase = body && typeof body.case === "string" ? body.case : "";
  if (!isRunCase(runCase)) {
    return NextResponse.json(
      { error: "Choose increased or decreased." },
      { status: 400 },
    );
  }

  let runId = "";
  try {
    await assertCapacity();
    runId = await createRun(user.userId, runCase);
    await startAgent({ runId, userId: user.userId, case: runCase });
    return NextResponse.json({ id: runId }, { status: 201 });
  } catch (error) {
    if (runId) {
      await failRun(
        user.userId,
        runId,
        error instanceof Error ? error.message : "The agent did not start.",
      );
    }
    if (error instanceof RunRejected) {
      return NextResponse.json(
        { error: error.message, runId: error.runId ?? runId },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : "Could not start the run.";
    return NextResponse.json({ error: message, runId }, { status: 500 });
  }
}
