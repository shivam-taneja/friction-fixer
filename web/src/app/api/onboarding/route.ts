import { NextResponse } from "next/server";
import { requestUser } from "@/lib/auth/request-user";
import {
  completeProject,
  OnboardingError,
  saveProjectAnalytics,
  saveProjectRepo,
  saveProjectSite,
  verifyProjectDomain,
} from "@/lib/db/projects";
import {
  analyticsProviders,
  projectGoals,
  type AnalyticsProvider,
  type OwnershipMethod,
  type ProjectGoal,
} from "@/lib/db/schema/project";

function isMethod(value: unknown): value is OwnershipMethod {
  return value === "file" || value === "dns";
}

function isProvider(value: unknown): value is AnalyticsProvider {
  return analyticsProviders.includes(value as AnalyticsProvider);
}

function isGoal(value: unknown): value is ProjectGoal {
  return projectGoals.includes(value as ProjectGoal);
}

export async function POST(request: Request) {
  const user = await requestUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body as {
    action?: unknown;
    url?: unknown;
    method?: unknown;
    provider?: unknown;
    repo?: unknown;
    goal?: unknown;
  };

  try {
    if (
      (action.action === "site" || action.action === "verify") &&
      typeof action.url === "string" &&
      isMethod(action.method)
    ) {
      const draft =
        action.action === "site"
          ? await saveProjectSite(user.userId, action.url, action.method)
          : await verifyProjectDomain(user.userId, action.url, action.method);
      return NextResponse.json({ draft });
    }

    if (action.action === "analytics" && isProvider(action.provider)) {
      const draft = await saveProjectAnalytics(user.userId, action.provider);
      return NextResponse.json({ draft });
    }

    if (action.action === "github" && typeof action.repo === "string") {
      const draft = await saveProjectRepo(user.userId, action.repo);
      return NextResponse.json({ draft });
    }

    if (action.action === "goal" && isGoal(action.goal)) {
      const draft = await completeProject(user.userId, action.goal);
      return NextResponse.json({ draft });
    }

    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  } catch (error) {
    if (error instanceof OnboardingError) {
      return NextResponse.json(
        { error: error.message, draft: error.draft },
        { status: 400 },
      );
    }
    console.error("Onboarding save failed", error);
    return NextResponse.json(
      { error: "Couldn't save your progress." },
      { status: 500 },
    );
  }
}
