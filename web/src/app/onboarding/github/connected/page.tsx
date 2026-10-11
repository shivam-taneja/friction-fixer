import { Suspense } from "react";
import type { Metadata } from "next";
import { GithubConnected } from "./github-connected";

export const metadata: Metadata = {
  title: "Connecting GitHub — Friction Fixer",
  robots: { index: false, follow: false },
};

export default function GithubConnectedPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-svh place-items-center bg-background px-6 text-sm text-muted-foreground">
          Finishing the GitHub connection…
        </main>
      }
    >
      <GithubConnected />
    </Suspense>
  );
}
