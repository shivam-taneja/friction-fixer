import { POSTHOG_OAUTH_ORIGIN, posthogClientId } from "@/lib/posthog/config";

const API_HOSTS = ["https://us.posthog.com", "https://eu.posthog.com"];

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scoped_teams?: unknown;
  posthog_base_url?: string;
  posthog_region?: string;
  error?: string;
  error_description?: string;
};

type PosthogTokens = {
  accessToken: string;
  refreshToken: string;
  projectIds: string[];
  apiHost: string | null;
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

export async function findPosthogProject(tokens: PosthogTokens) {
  const hosts = tokens.apiHost
    ? [tokens.apiHost, ...API_HOSTS.filter((host) => host !== tokens.apiHost)]
    : [...API_HOSTS];
  const projectId = tokens.projectIds[0];
  if (projectId) {
    for (const host of hosts) {
      const named = await readProject(host, projectId, tokens.accessToken);
      if (named) return named;
    }
    if (tokens.apiHost) {
      return {
        projectId,
        projectName: "PostHog project",
        apiHost: tokens.apiHost,
      };
    }
  }

  let lastError = "PostHog did not return a project.";
  for (const host of hosts) {
    const response = await fetch(`${host}/api/projects/`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
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
    const project = rows.find(isProject);
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
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    projectIds: projectIds(body.scoped_teams),
    apiHost: apiHostFrom(body),
  };
}

async function readProject(host: string, projectId: string, accessToken: string) {
  const response = await fetch(`${host}/api/projects/${projectId}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as unknown;
  if (!isProject(body)) return null;
  return {
    projectId: String(body.id),
    projectName: body.name?.trim() || "PostHog project",
    apiHost: host,
  };
}

function projectIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "number" || typeof item === "string" ? String(item) : "",
    )
    .filter((id) => /^\d+$/.test(id));
}

function apiHostFrom(body: TokenResponse) {
  const base = body.posthog_base_url?.trim().replace(/\/$/, "");
  if (base === "https://eu.posthog.com" || base === "https://us.posthog.com") {
    return base;
  }
  if (body.posthog_region === "eu") return "https://eu.posthog.com";
  if (body.posthog_region === "us") return "https://us.posthog.com";
  return null;
}

function isProject(
  value: unknown,
): value is { id: number | string; name?: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      (typeof value.id === "number" || typeof value.id === "string"),
  );
}

function messageFrom(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  const detail = "detail" in body ? body.detail : null;
  return typeof detail === "string" ? detail : "";
}
