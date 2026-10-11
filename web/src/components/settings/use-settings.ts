"use client";

import { useEffect, useState } from "react";
import type {
  AnalyticsProvider,
  ProjectGoal,
} from "@/components/onboarding/logic";
import { OnboardingStatus } from "@/lib/db/schema/user";

export type SettingsProject = {
  analyticsProvider: AnalyticsProvider;
  goal: ProjectGoal;
  repository: string;
  branch: string;
  framework: string;
  sourceFolder: string;
  accountLogin: string;
};

export type SettingsData =
  | { status: typeof OnboardingStatus.not_started }
  | { status: typeof OnboardingStatus.complete; project: SettingsProject };

export function useSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        } & SettingsData;
        if (!response.ok) {
          throw new Error(body.error || "Could not load settings.");
        }
        return body;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load settings.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function removeConnection(repository: string) {
    setRemoving(true);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "DELETE",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Could not remove the connection.");
      }
      setData({ status: OnboardingStatus.not_started });
      return true;
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove the connection.",
      );
      return false;
    } finally {
      setRemoving(false);
    }
  }

  return {
    data,
    error,
    loading: !data && !error,
    removing,
    removeConnection,
  };
}
