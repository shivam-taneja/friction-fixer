import {
  GITHUB_INSTALL_MESSAGE,
  type GithubConnection,
  type GithubInstallMessage,
  type GithubSelection,
} from "@/lib/github/types";

export function setSelectionFromConnection(
  connection: GithubConnection,
  selection: GithubSelection | null,
  setSelection: (value: GithubSelection | null) => void,
) {
  if (!connection.connected) return;

  const match = selection
    ? connection.repos.find((repo) => repo.fullName === selection.fullName)
    : undefined;

  if (selection && !match) {
    setSelection(null);
    return;
  }

  if (
    selection &&
    match &&
    selection.installationId !== connection.installationId
  ) {
    setSelection({
      ...selection,
      installationId: connection.installationId,
      defaultBranch: match.defaultBranch,
    });
    return;
  }

  if (!selection && connection.repos.length === 1) {
    const repo = connection.repos[0];
    setSelection({
      installationId: connection.installationId,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      branch: repo.defaultBranch,
    });
  }
}

export function isInstallMessage(
  value: unknown,
): value is GithubInstallMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === GITHUB_INSTALL_MESSAGE
  );
}

export async function readJson<T>(
  path: string,
  method: "GET" | "DELETE" = "GET",
): Promise<T> {
  const response = await fetch(path, { method, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok) {
    throw new Error(body.error || "Could not reach GitHub.");
  }
  return body;
}

export function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Could not reach GitHub.";
}
