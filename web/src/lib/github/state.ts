import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const GITHUB_STATE_COOKIE = "ff-github-state";

type StatePayload = {
  userId: string;
  nonce: string;
  exp: number;
};

export function githubStateCookieOptions() {
  return {
    path: "/api/github",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
  };
}

export function createGithubState(userId: string) {
  const payload: StatePayload = {
    userId,
    nonce: randomBytes(16).toString("base64url"),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readGithubState(state: string, userId: string) {
  const [body, signature, extra] = state.split(".");
  if (!body || !signature || extra) return null;
  if (!safeEqual(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as Partial<StatePayload>;
    if (payload.userId !== userId) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readRequestCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
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
