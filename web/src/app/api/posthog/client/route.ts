import { NextResponse } from "next/server";
import {
  posthogClientId,
  posthogRedirectUri,
  POSTHOG_SCOPES,
} from "@/lib/posthog/config";
import { siteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGINS = [siteUrl, "http://localhost:3000", "http://127.0.0.1:3000"];

export function GET() {
  return NextResponse.json(
    {
      client_id: posthogClientId(),
      client_name: "Friction Fixer",
      logo_uri: `${siteUrl}/logo.png`,
      redirect_uris: ORIGINS.map((origin) => posthogRedirectUri(origin)),
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      "com.posthog": {
        scopes: [...POSTHOG_SCOPES],
      },
    },
    {
      headers: { "Cache-Control": "public, max-age=300" },
    },
  );
}
