"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GITHUB_INSTALL_MESSAGE } from "@/lib/github/types";

export function GithubConnected() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const error = params.get("error") ?? undefined;
    const payload = { type: GITHUB_INSTALL_MESSAGE, error };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
      window.close();
      return;
    }

    const next = new URL("/onboarding", window.location.origin);
    if (error) next.searchParams.set("github_error", error);
    else next.searchParams.set("github", "connected");
    router.replace(`${next.pathname}${next.search}`);
  }, [params, router]);

  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-sm text-muted-foreground">
      Finishing the GitHub connection…
    </main>
  );
}
