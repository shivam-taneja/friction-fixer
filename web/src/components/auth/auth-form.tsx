"use client";

import { useEffect, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type AuthProvider as FirebaseAuthProvider,
  type AuthError,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  useLastAuth,
  type AuthProviderName,
} from "@/components/auth/use-last-auth";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { getFirebaseAuth } from "@/lib/firebase/client-app";
import { mapFirebaseError } from "@/lib/firebase/errors";

function LastUsedBadge() {
  return (
    <Badge
      variant="secondary"
      className="pointer-events-none absolute -top-2.5 right-3 z-10 px-1.5 py-0 text-[10px] leading-4 shadow-sm"
    >
      Last used
    </Badge>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AuthProviderName | null>(null);
  const lastUsed = useLastAuth((state) => state.provider);
  const setLastUsed = useLastAuth((state) => state.setProvider);

  useEffect(() => {
    void useLastAuth.persist.rehydrate();
  }, []);

  async function signIn(
    provider: FirebaseAuthProvider,
    providerName: AuthProviderName,
  ) {
    setError(null);
    setPending(providerName);

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, provider);

      const token = await credential.user.getIdToken();

      const response = await fetch("/api/login", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Login failed (${response.status}): ${body}`);
      }

      setLastUsed(providerName);
      router.replace("/dashboard/runs");
    } catch (e) {
      console.error("[AuthForm] Sign-in failed:", e);

      const err = e as AuthError;
      const message = err.code ? mapFirebaseError(err) : err.message;
      setError(message);
      notify.error(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full cursor-pointer"
          disabled={pending !== null}
          onClick={() => void signIn(new GoogleAuthProvider(), "google")}
        >
          <GoogleMark />
          {pending === "google" ? "Continuing…" : "Continue with Google"}
        </Button>
        {lastUsed === "google" ? <LastUsedBadge /> : null}
      </div>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full cursor-pointer"
          disabled={pending !== null}
          onClick={() => void signIn(new GithubAuthProvider(), "github")}
        >
          <GithubIcon className="size-4" />
          {pending === "github" ? "Continuing…" : "Continue with GitHub"}
        </Button>
        {lastUsed === "github" ? <LastUsedBadge /> : null}
      </div>
      {error && (
        <p
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
