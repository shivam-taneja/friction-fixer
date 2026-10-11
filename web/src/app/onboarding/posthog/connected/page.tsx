import { Suspense } from "react";
import type { Metadata } from "next";
import { PosthogConnected } from "./posthog-connected";

export const metadata: Metadata = {
  title: "Connecting PostHog — Friction Fixer",
  robots: { index: false, follow: false },
};

export default function PosthogConnectedPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-svh place-items-center bg-background px-6 text-sm text-muted-foreground">
          Finishing the PostHog connection…
        </main>
      }
    >
      <PosthogConnected />
    </Suspense>
  );
}
