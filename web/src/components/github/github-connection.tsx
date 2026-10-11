"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { GithubAccount } from "@/components/github/github-account";
import { GithubBranchSelect } from "@/components/github/github-branch-select";
import { GithubConnectPrompt } from "@/components/github/github-connect-prompt";
import { GithubConnectionSkeleton } from "@/components/github/github-connection-skeleton";
import {
  isInstallMessage,
  messageFrom,
  readJson,
  setSelectionFromConnection,
} from "@/components/github/github-connection-helpers";
import { GithubProjectSetup } from "@/components/github/github-project-setup";
import { GithubRepoSelect } from "@/components/github/github-repo-select";
import { takeGithubInstallResult } from "@/components/github/install-result";
import { Button } from "@/components/ui/button";
import {
  type GithubConnection as GithubConnectionState,
  type GithubSelection,
} from "@/lib/github/types";

export function GithubConnection({
  selection: selectionProp,
  onSelectionChange,
}: {
  selection?: GithubSelection | null;
  onSelectionChange?: (value: GithubSelection | null) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState<GithubSelection | null>(
    null,
  );
  const selection = selectionProp !== undefined ? selectionProp : uncontrolled;
  const [connection, setConnection] = useState<GithubConnectionState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(
    () => takeGithubInstallResult()?.error ?? "",
  );
  const [refreshKey, setRefreshKey] = useState(0);

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

  function setSelection(value: GithubSelection | null) {
    if (selectionProp === undefined) setUncontrolled(value);
    onSelectionChange?.(value);
  }

  const syncSelection = useEffectEvent((next: GithubConnectionState) => {
    setSelectionFromConnection(next, selection, setSelection);
  });

  useEffect(() => {
    let cancelled = false;

    readJson<GithubConnectionState>("/api/github/connection")
      .then((next) => {
        if (cancelled) return;
        setConnection(next);
        setLoading(false);
        syncSelection(next);
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
  }, [refreshKey]);

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
      setSelection(null);
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

  async function disconnect() {
    setError("");
    setDisconnecting(true);
    try {
      const next = await readJson<GithubConnectionState>(
        "/api/github/connection",
        "DELETE",
      );
      setSelection(null);
      setConnection(next);
    } catch (disconnectError) {
      setError(messageFrom(disconnectError));
    } finally {
      setDisconnecting(false);
    }
  }

  const repos = connection?.connected ? connection.repos : [];
  const branches = branchLoad.repo === selectedRepo ? branchLoad.branches : [];
  const branchesLoading =
    branchLoad.repo === selectedRepo ? branchLoad.loading : false;

  return (
    <div className="grid gap-6">
      {loading && !connection?.connected ? <GithubConnectionSkeleton /> : null}

      {connection?.connected ? (
        <div className="grid gap-5">
          <GithubAccount
            login={connection.accountLogin}
            authorizing={authorizing}
            disconnecting={disconnecting}
            onChange={connect}
            onDisconnect={() => void disconnect()}
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
                onSelectionChange={setSelection}
              />
              {selection ? (
                <>
                  <GithubBranchSelect
                    selection={selection}
                    branches={branches}
                    loading={branchesLoading}
                    onBranchChange={(branch) =>
                      setSelection({
                        installationId: selection.installationId,
                        fullName: selection.fullName,
                        defaultBranch: selection.defaultBranch,
                        branch,
                      })
                    }
                  />
                  {branchesLoading ? null : (
                    <GithubProjectSetup
                      key={`${selection.fullName}@${selection.branch}`}
                      fullName={selection.fullName}
                      branch={selection.branch}
                      onResolved={(project) =>
                        setSelection({
                          installationId: selection.installationId,
                          fullName: selection.fullName,
                          defaultBranch: selection.defaultBranch,
                          branch: selection.branch,
                          framework: project.framework,
                          sourceFolder: project.sourceFolder,
                        })
                      }
                    />
                  )}
                </>
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
