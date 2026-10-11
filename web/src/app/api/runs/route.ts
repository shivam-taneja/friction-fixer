import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/request-user";
import {
  assertCapacity,
  createRun,
  failRun,
  listRuns,
  readReady,
  RunRejected,
  startAgent,
} from "@/lib/db/runs";
import { isMockCase, type RunCase } from "@/lib/db/schema/run";

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
  const requested = body && typeof body.case === "string" ? body.case : "";

  let runId = "";
  try {
    const gate = await readReady(user.userId);
    if (!gate.ready) {
      return NextResponse.json(
        {
          error:
            gate.error ||
            "This project needs a baseline before a run can start. Wait until PostHog has visitor data, or turn on mock data in Settings.",
        },
        { status: 409 },
      );
    }
    let runCase: RunCase;
    if (gate.mock) {
      if (!isMockCase(requested)) {
        return NextResponse.json(
          { error: "Choose increased or decreased." },
          { status: 400 },
        );
      }
      runCase = requested;
    } else {
      runCase = "live";
    }
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
