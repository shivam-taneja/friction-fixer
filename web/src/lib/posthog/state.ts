import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const POSTHOG_STATE_COOKIE = "ff-posthog-state";

type StatePayload = {
  userId: string;
  nonce: string;
  verifier: string;
  redirectUri: string;
  exp: number;
};

export function posthogStateCookieOptions() {
  return {
    path: "/api/posthog",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
  };
}

export function createPosthogState(
  userId: string,
  verifier: string,
  redirectUri: string,
) {
  const payload: StatePayload = {
    userId,
    nonce: randomBytes(16).toString("base64url"),
    verifier,
    redirectUri,
    exp: Date.now() + 10 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readPosthogState(state: string, userId: string) {
  const [body, signature, extra] = state.split(".");
  if (!body || !signature || extra) return null;
  if (!safeEqual(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as Partial<StatePayload>;
    if (payload.userId !== userId) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    if (typeof payload.verifier !== "string" || !payload.verifier) return null;
    if (typeof payload.redirectUri !== "string" || !payload.redirectUri) {
      return null;
    }
    return {
      verifier: payload.verifier,
      redirectUri: payload.redirectUri,
    };
  } catch {
    return null;
  }
}

function sign(body: string) {
  const secret = process.env.COOKIE_SECRET_KEY;
  if (!secret) throw new Error("Missing COOKIE_SECRET_KEY.");
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
