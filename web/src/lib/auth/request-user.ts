import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { signInIdentity } from "@/lib/auth/identity";
import { userDocId } from "@/lib/db/users";
import { authConfig } from "@/lib/firebase/auth-config";

export async function requestUser() {
  const tokens = await getTokens(await cookies(), {
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: authConfig.serviceAccount,
  });
  if (!tokens) return null;

  const identity = signInIdentity(tokens.decodedToken);
  if (!identity) return null;

  return {
    userId: userDocId(identity.email, identity.provider, identity.accountId),
  };
}
