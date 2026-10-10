import type { DecodedIdToken } from "next-firebase-auth-edge/auth";
import type { AuthProviderName } from "@/lib/db/schema/user";

export type SignInIdentity = {
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
  provider: AuthProviderName;
  accountId: string;
};

function authProvider(token: DecodedIdToken): AuthProviderName | null {
  if (token.firebase.sign_in_provider === "google.com") return "google";
  if (token.firebase.sign_in_provider === "github.com") return "github";
  return null;
}

function accountId(token: DecodedIdToken) {
  const ids = token.firebase.identities[token.firebase.sign_in_provider];
  if (Array.isArray(ids) && typeof ids[0] === "string") return ids[0];
  return token.uid;
}

export function signInIdentity(token: DecodedIdToken): SignInIdentity | null {
  const provider = authProvider(token);
  if (!provider) return null;

  return {
    email: token.email,
    name: token.name,
    image: token.picture,
    provider,
    accountId: accountId(token),
  };
}
