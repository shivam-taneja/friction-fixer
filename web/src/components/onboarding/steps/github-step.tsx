"use client";

import { useEffect, useRef, useState } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { GithubAccount } from "@/components/onboarding/steps/github/github-account";
import { GithubBranchSelect } from "@/components/onboarding/steps/github/github-branch-select";
import { GithubConnectPrompt } from "@/components/onboarding/steps/github/github-connect-prompt";
import { GithubRepoSelect } from "@/components/onboarding/steps/github/github-repo-select";
import {
  GITHUB_INSTALL_MESSAGE,
  type GithubConnection,
  type GithubInstallMessage,
  type GithubSelection,
} from "@/lib/github/types";

export function GithubStep({
  selection,
  onSelectionChange,
}: {
  selection: GithubSelection | null;
  onSelectionChange: (value: GithubSelection | null) => void;
}) {
  const [connection, setConnection] = useState<GithubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const selectedRepo = selection?.fullName ?? "";
  const [branchLoad, setBranchLoad] = useState<{
    repo: string;
    branches: string[];
    loading: boolean;
  }>({ repo: "", branches: [], loading: false });

  if (branchLoad.repo !== selectedRepo) {
    setBranchLoad({
      repo: selectedRepo,
      branches: [],
      loading: selectedRepo.length > 0,
    });
  }

  useEffect(() => {
    let cancelled = false;

    readJson<GithubConnection>("/api/github/connection")
      .then((next) => {
        if (cancelled) return;
        setConnection(next);
        setLoading(false);
        reconcileSelection(next, selectionRef.current, onSelectionChange);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setConnection({ connected: false });
        setError(messageFrom(loadError));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onSelectionChange, refreshKey]);

  useEffect(() => {
    if (!selectedRepo) return;

    let cancelled = false;

    readJson<{ branches: string[] }>(
      `/api/github/branches?repo=${encodeURIComponent(selectedRepo)}`,
    )
      .then((body) => {
        if (cancelled) return;
        setBranchLoad({
          repo: selectedRepo,
          branches: body.branches,
          loading: false,
        });
      })
      .catch((branchError) => {
        if (cancelled) return;
        setBranchLoad({ repo: selectedRepo, branches: [], loading: false });
        setError(messageFrom(branchError));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRepo]);

  function connect() {
    setError("");
    const popup = window.open(
      "/api/github/install",
      "friction-fixer-github",
      "popup,width=980,height=760",
    );

    if (!popup) {
      const destination = new URL("/api/github/install", window.location.href);
      window.location.assign(destination.href);
      return;
    }

    setAuthorizing(true);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      if (!isInstallMessage(event.data)) return;
      cleanup();
      if (event.data.error) {
        setError(event.data.error);
        return;
      }
      onSelectionChange(null);
      setConnection(null);
      setLoading(true);
      setRefreshKey((value) => value + 1);
    };

    const timer = window.setInterval(() => {
      if (popup.closed) cleanup();
    }, 400);

    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      setAuthorizing(false);
    }

    window.addEventListener("message", onMessage);
  }

  const repos = connection?.connected ? connection.repos : [];
  const branches =
    branchLoad.repo === selectedRepo ? branchLoad.branches : [];
  const branchesLoading =
    branchLoad.repo === selectedRepo ? branchLoad.loading : false;

  return (
    <div className="grid gap-6">
      {loading && !connection?.connected ? (
        <p className="text-sm text-muted-foreground">Checking GitHub…</p>
      ) : null}

      {connection?.connected ? (
        <div className="grid gap-5">
          <GithubAccount
            login={connection.accountLogin}
            authorizing={authorizing}
            onChange={connect}
          />

          {repos.length === 0 ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                This install cannot see a repository yet. Choose one on GitHub,
                then come back.
              </p>
              <Button type="button" variant="outline" onClick={connect}>
                <GithubIcon />
                Choose a repository
              </Button>
            </div>
          ) : (
            <>
              <GithubRepoSelect
                repos={repos}
                installationId={connection.installationId}
                selection={selection}
                onSelectionChange={onSelectionChange}
              />
              {selection ? (
                <GithubBranchSelect
                  selection={selection}
                  branches={branches}
                  loading={branchesLoading}
                  onBranchChange={(branch) =>
                    onSelectionChange({ ...selection, branch })
                  }
                />
              ) : null}
            </>
          )}
        </div>
      ) : loading ? null : (
        <GithubConnectPrompt authorizing={authorizing} onConnect={connect} />
      )}

      {error ? (
        <p
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function reconcileSelection(
  connection: GithubConnection,
  selection: GithubSelection | null,
  onSelectionChange: (value: GithubSelection | null) => void,
) {
  if (!connection.connected) return;

  const match = selection
    ? connection.repos.find((repo) => repo.fullName === selection.fullName)
    : undefined;

  if (selection && !match) {
    onSelectionChange(null);
    return;
  }

  if (
    selection &&
    match &&
    selection.installationId !== connection.installationId
  ) {
    onSelectionChange({
      ...selection,
      installationId: connection.installationId,
      defaultBranch: match.defaultBranch,
    });
    return;
  }

  if (!selection && connection.repos.length === 1) {
    const repo = connection.repos[0];
    onSelectionChange({
      installationId: connection.installationId,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      branch: repo.defaultBranch,
    });
  }
}

function isInstallMessage(value: unknown): value is GithubInstallMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === GITHUB_INSTALL_MESSAGE
  );
}

async function readJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) {
    throw new Error(body.error || "Could not reach GitHub.");
  }
  return body;
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Could not reach GitHub.";
}
