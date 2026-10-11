export const GITHUB_INSTALL_MESSAGE = "github-app-installed";

export type GithubInstallMessage = {
  type: typeof GITHUB_INSTALL_MESSAGE;
  error?: string;
};

export type GithubRepoOption = {
  id: number;
  fullName: string;
  private: boolean;
  defaultBranch: string;
};

export type GithubConnection =
  | { connected: false }
  | {
      connected: true;
      installationId: number;
      accountLogin: string;
      repos: GithubRepoOption[];
    };

export type GithubSelection = {
  installationId: number;
  fullName: string;
  defaultBranch: string;
  branch: string;
};

export function parseRepoFullName(fullName: string) {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(fullName);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export function isGithubSelection(value: unknown): value is GithubSelection {
  if (!value || typeof value !== "object") return false;
  const selection = value as Partial<GithubSelection>;
  return (
    typeof selection.installationId === "number" &&
    Number.isInteger(selection.installationId) &&
    typeof selection.fullName === "string" &&
    parseRepoFullName(selection.fullName) !== null &&
    typeof selection.defaultBranch === "string" &&
    selection.defaultBranch.length > 0 &&
    typeof selection.branch === "string" &&
    selection.branch.length > 0
  );
}
