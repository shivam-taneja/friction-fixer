import type { AuthError } from "firebase/auth";

const fallback = "Sign-in failed. Try again.";

const messages: Record<string, string> = {
  "auth/popup-closed-by-user":
    "The sign-in window was closed before finishing.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "The sign-in popup was blocked. Allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "That email is already used with a different sign-in method.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  OAuthSignin: "The sign-in provider could not be reached.",
  OAuthCallback: "The sign-in provider returned an error.",
  AccessDenied: "That account is not allowed to sign in.",
  Configuration: "Auth is missing a client id, secret, or Firebase key.",
};

export function mapFirebaseError(error: AuthError | string) {
  const code = typeof error === "string" ? error : error.code;
  return messages[code] ?? fallback;
}
