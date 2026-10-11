"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { POSTHOG_MESSAGE } from "@/lib/posthog/config";

const resultKey = "ff-posthog-result";

export function PosthogConnected() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const error = params.get("error") ?? undefined;
    const payload = { type: POSTHOG_MESSAGE, error };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
      window.close();
      return;
    }

    sessionStorage.setItem(resultKey, JSON.stringify({ error: error ?? null }));
    router.replace("/onboarding");
  }, [params, router]);

  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-sm text-muted-foreground">
      Finishing the PostHog connection…
    </main>
  );
}
