import { POSTHOG_OAUTH_ORIGIN, posthogClientId } from "@/lib/posthog/config";

const API_HOSTS = ["https://us.posthog.com", "https://eu.posthog.com"];

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export async function exchangePosthogCode(input: {
  code: string;
  redirectUri: string;
  verifier: string;
}) {
  return posthogToken({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
    client_id: posthogClientId(),
  });
}

export async function findPosthogProject(accessToken: string) {
  let lastError = "PostHog did not return a project.";
  for (const host of API_HOSTS) {
    const response = await fetch(`${host}/api/projects/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) continue;
    const body = (await response.json().catch(() => null)) as
      | { results?: unknown; detail?: unknown }
      | unknown[]
      | null;
    if (!response.ok) {
      lastError = messageFrom(body) || lastError;
      continue;
    }
    const rows = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : [];
    const project = rows.find(
      (row) =>
        row &&
        typeof row === "object" &&
        "id" in row &&
        (typeof row.id === "number" || typeof row.id === "string"),
    ) as { id: number | string; name?: string } | undefined;
    if (!project) continue;
    return {
      projectId: String(project.id),
      projectName: project.name?.trim() || "PostHog project",
      apiHost: host,
    };
  }
  throw new Error(lastError);
}

async function posthogToken(fields: Record<string, string>) {
  const response = await fetch(`${POSTHOG_OAUTH_ORIGIN}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
  const body = (await response
    .json()
    .catch(() => null)) as TokenResponse | null;
  if (!response.ok || !body?.access_token || !body.refresh_token) {
    throw new Error(
      body?.error_description ||
        body?.error ||
        "PostHog did not return a token.",
    );
  }
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

function messageFrom(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  const detail = "detail" in body ? body.detail : null;
  return typeof detail === "string" ? detail : "";
}
