"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const next = await readJson<GithubConnection>("/api/github/connection");
        if (!cancelled) setConnection(next);
      } catch (loadError) {
        if (!cancelled) {
          setConnection({ connected: false });
          setError(messageFrom(loadError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!connection?.connected) return;

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
  }, [connection, onSelectionChange, selection]);

  useEffect(() => {
    if (!selection?.fullName) {
      setBranches([]);
      return;
    }

    let cancelled = false;
    setBranchesLoading(true);

    readJson<{ branches: string[] }>(
      `/api/github/branches?repo=${encodeURIComponent(selection.fullName)}`,
    )
      .then((body) => {
        if (!cancelled) setBranches(body.branches);
      })
      .catch((branchError) => {
        if (!cancelled) setError(messageFrom(branchError));
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selection?.fullName]);

  function connect() {
    setError("");
    const popup = window.open(
      "/api/github/install",
      "friction-fixer-github",
      "popup,width=980,height=760",
    );

    if (!popup) {
      window.location.assign("/api/github/install");
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
  const selectedRepo = repos.find(
    (repo) => repo.fullName === selection?.fullName,
  );
  const branchNames =
    selection && !branches.includes(selection.branch)
      ? [selection.branch, ...branches]
      : branches;

  return (
    <div className="grid gap-6">
      {loading && !connection?.connected ? (
        <p className="text-sm text-muted-foreground">Checking GitHub…</p>
      ) : null}

      {connection?.connected ? (
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{connection.accountLogin}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                GitHub App connected
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={authorizing}
              onClick={connect}
              className="cursor-pointer"
            >
              {authorizing ? "Waiting…" : "Change"}
            </Button>
          </div>

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
              <div className="grid gap-2">
                <Label htmlFor="github-repo">Repository</Label>
                <Select
                  value={selection?.fullName ?? ""}
                  onValueChange={(value) => {
                    if (!value) return;
                    const repo = repos.find((item) => item.fullName === value);
                    if (!repo || !connection.connected) return;
                    onSelectionChange({
                      installationId: connection.installationId,
                      fullName: repo.fullName,
                      defaultBranch: repo.defaultBranch,
                      branch: repo.defaultBranch,
                    });
                  }}
                >
                  <SelectTrigger id="github-repo" className="h-11 w-full">
                    <SelectValue placeholder="Choose a repository">
                      {selectedRepo
                        ? repoLabel(selectedRepo.fullName, selectedRepo.private)
                        : "Choose a repository"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        {repoLabel(repo.fullName, repo.private)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The agent opens pull requests in this repository.
                </p>
              </div>

              {selection ? (
                <div className="grid gap-2">
                  <Label htmlFor="github-branch">Branch</Label>
                  <Select
                    value={selection.branch}
                    onValueChange={(branch) => {
                      if (!branch) return;
                      onSelectionChange({ ...selection, branch });
                    }}
                  >
                    <SelectTrigger id="github-branch" className="h-11 w-full">
                      <SelectValue placeholder="Choose a branch">
                        {selection.branch}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {branchNames.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                          {branch === selection.defaultBranch
                            ? " · default"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {branchesLoading
                      ? "Loading branches…"
                      : "Pull requests open against this branch."}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : loading ? null : (
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-14 w-full justify-start px-4 cursor-pointer"
            disabled={authorizing}
            onClick={connect}
          >
            <GithubIcon />
            {authorizing ? "Waiting for GitHub…" : "Connect GitHub"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Install the Friction Fixer app on one repository.
          </p>
        </div>
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

function repoLabel(fullName: string, isPrivate: boolean) {
  return isPrivate ? `${fullName} (private)` : fullName;
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
