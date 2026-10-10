"use client";

import { useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type AuthProvider as FirebaseAuthProvider,
  type AuthError,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client-app";
import { mapFirebaseError } from "@/lib/firebase/errors";

type ProviderType = "google" | "github";

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

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C16.6 4.8 17.6 5.1 17.6 5.1c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 24 12c0-6.6-5.4-12-12-12z" />
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ProviderType | null>(null);

  async function signIn(
    provider: FirebaseAuthProvider,
    providerName: ProviderType,
  ) {
    setError(null);
    setPending(providerName);

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, provider);
      const token = await credential.user.getIdToken();

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.refresh();
      router.replace("/dashboard");
    } catch (e) {
      const err = e as AuthError;
      setError(mapFirebaseError(err));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full"
        disabled={pending !== null}
        onClick={() => void signIn(new GoogleAuthProvider(), "google")}
      >
        <GoogleMark />
        {pending === "google" ? "Continuing…" : "Continue with Google"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full"
        disabled={pending !== null}
        onClick={() => void signIn(new GithubAuthProvider(), "github")}
      >
        <GitHubMark />
        {pending === "github" ? "Continuing…" : "Continue with GitHub"}
      </Button>
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
