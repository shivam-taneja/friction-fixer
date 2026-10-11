import { siteUrl } from "@/lib/seo";

export const POSTHOG_OAUTH_ORIGIN = "https://oauth.posthog.com";

export const POSTHOG_SCOPES = [
  "project:read",
  "query:read",
  "web_analytics:read",
  "user:read",
] as const;

export const POSTHOG_MESSAGE = "ff-posthog";

const REDIRECT_ORIGINS = [
  siteUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export function posthogClientId() {
  return `${siteUrl}/api/posthog/client`;
}

export function posthogRedirectUri(origin: string) {
  return `${origin}/api/posthog/callback`;
}

export function posthogRedirectAllowed(origin: string) {
  return REDIRECT_ORIGINS.includes(origin);
}

export function posthogAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL("/oauth/authorize/", POSTHOG_OAUTH_ORIGIN);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", posthogClientId());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", POSTHOG_SCOPES.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("required_access_level", "project");
  return url;
}
