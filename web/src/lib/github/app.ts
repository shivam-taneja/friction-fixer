import { createSign } from "node:crypto";
import { githubAppConfig } from "@/lib/github/config";
import { parseRepoFullName, type GithubRepoOption } from "@/lib/github/types";

const tokenCache = new Map<number, { token: string; expiresAt: number }>();

export class GithubRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getInstallationAccount(installationId: number) {
  const body = await githubJson(
    `/app/installations/${installationId}`,
    appJwt(),
  );
  return readAccount(body);
}

export async function listInstallationRepos(installationId: number) {
  const token = await installationToken(installationId);
  const repos: GithubRepoOption[] = [];
  let url = "https://api.github.com/installation/repositories?per_page=100";

  for (let page = 0; page < 10 && url; page += 1) {
    const response = await githubFetch(url, token);
    const body = (await response.json()) as { repositories?: unknown };
    if (Array.isArray(body.repositories)) {
      for (const repo of body.repositories) {
        const option = toRepoOption(repo);
        if (option) repos.push(option);
      }
    }
    url = nextLink(response.headers.get("link"));
  }

  repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return repos;
}

export async function listBranches(installationId: number, fullName: string) {
  const repo = parseRepoFullName(fullName);
  if (!repo) throw new GithubRequestError("Choose a repository.", 400);

  const token = await installationToken(installationId);
  const names: string[] = [];
  let url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/branches?per_page=100`;

  for (let page = 0; page < 10 && url; page += 1) {
    const response = await githubFetch(url, token);
    const body = (await response.json()) as unknown;
    if (Array.isArray(body)) {
      for (const branch of body) {
        if (
          branch &&
          typeof branch === "object" &&
          typeof (branch as { name?: unknown }).name === "string"
        ) {
          names.push((branch as { name: string }).name);
        }
      }
    }
    url = nextLink(response.headers.get("link"));
  }

  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

export async function assertRepoBranch(input: {
  installationId: number;
  fullName: string;
  branch: string;
}) {
  const repo = parseRepoFullName(input.fullName);
  if (!repo) throw new GithubRequestError("Choose a repository.", 400);

  const token = await installationToken(input.installationId);
  const details = await githubJson(`/repos/${repo.owner}/${repo.repo}`, token);
  const defaultBranch =
    details &&
    typeof details === "object" &&
    typeof (details as { default_branch?: unknown }).default_branch === "string"
      ? (details as { default_branch: string }).default_branch
      : "";

  await githubJson(
    `/repos/${repo.owner}/${repo.repo}/branches/${encodeURIComponent(input.branch)}`,
    token,
  );

  return { defaultBranch };
}

export async function inspectRepository(input: {
  installationId: number;
  fullName: string;
  branch: string;
}) {
  const repo = parseRepoFullName(input.fullName);
  if (!repo) throw new GithubRequestError("Choose a repository.", 400);

  const token = await installationToken(input.installationId);
  const ref = encodeURIComponent(input.branch);
  const branchBody = await githubJson(
    `/repos/${repo.owner}/${repo.repo}/branches/${ref}`,
    token,
  );
  const sha = readCommitSha(branchBody);
  if (!sha) throw new GithubRequestError("Choose a branch.", 400);

  const treeBody = await githubJson(
    `/repos/${repo.owner}/${repo.repo}/git/trees/${sha}?recursive=1`,
    token,
  );
  const { paths, folders } = readRepoTree(treeBody);
  let dependencies: string[] = [];

  if (paths.includes("package.json")) {
    try {
      const file = await githubJson(
        `/repos/${repo.owner}/${repo.repo}/contents/package.json?ref=${ref}`,
        token,
      );
      dependencies = readDependencyNames(file);
    } catch (error) {
      if (!(error instanceof GithubRequestError) || error.status !== 404) {
        throw error;
      }
    }
  }

  return { paths, folders, dependencies };
}

export async function assertRepoFolder(input: {
  installationId: number;
  fullName: string;
  branch: string;
  path: string;
}) {
  if (input.path === ".") return;

  const repo = parseRepoFullName(input.fullName);
  if (!repo) throw new GithubRequestError("Choose a repository.", 400);

  const token = await installationToken(input.installationId);
  const path = input.path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const folder = await githubJson(
    `/repos/${repo.owner}/${repo.repo}/contents/${path}?ref=${encodeURIComponent(input.branch)}`,
    token,
  );
  if (!Array.isArray(folder)) {
    throw new GithubRequestError("Choose a source folder, not a file.", 400);
  }
}

export async function deleteInstallation(installationId: number) {
  tokenCache.delete(installationId);
  try {
    await githubFetch(
      `https://api.github.com/app/installations/${installationId}`,
      appJwt(),
      "DELETE",
    );
  } catch (error) {
    if (error instanceof GithubRequestError && error.status === 404) return;
    throw error;
  }
}

async function installationToken(installationId: number) {
  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const body = await githubJson(
    `/app/installations/${installationId}/access_tokens`,
    appJwt(),
    "POST",
  );
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { token?: unknown }).token !== "string"
  ) {
    throw new GithubRequestError("GitHub did not return an access token.", 502);
  }

  const token = (body as { token: string }).token;
  const expiresAtRaw = (body as { expires_at?: unknown }).expires_at;
  const expiresAt =
    typeof expiresAtRaw === "string" ? Date.parse(expiresAtRaw) : Date.now();
  tokenCache.set(installationId, {
    token,
    expiresAt: Number.isNaN(expiresAt) ? Date.now() + 5 * 60_000 : expiresAt,
  });
  return token;
}

function appJwt() {
  const { appId, privateKey } = githubAppConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: appId }),
  );
  const data = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(data);
  return `${data}.${signer.sign(privateKey).toString("base64url")}`;
}

async function githubJson(
  path: string,
  token: string,
  method: "GET" | "POST" = "GET",
) {
  const response = await githubFetch(
    path.startsWith("https://") ? path : `https://api.github.com${path}`,
    token,
    method,
  );
  return response.json() as Promise<unknown>;
}

async function githubFetch(
  url: string,
  token: string,
  method: "GET" | "POST" | "DELETE" = "GET",
) {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "friction-fixer",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? "{}" : undefined,
  });

  if (!response.ok) {
    let message = "GitHub could not complete that request.";
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === "string" && body.message)
        message = body.message;
    } catch {
      message = response.statusText || message;
    }
    throw new GithubRequestError(message, response.status);
  }

  return response;
}

function readCommitSha(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const commit = (body as { commit?: { sha?: unknown } }).commit;
  return commit && typeof commit.sha === "string" ? commit.sha : "";
}

function readRepoTree(body: unknown) {
  const paths: string[] = [];
  const folders = new Set<string>(["."]);
  if (!body || typeof body !== "object") return { paths, folders: ["."] };
  const tree = (body as { tree?: unknown }).tree;
  if (!Array.isArray(tree)) return { paths, folders: ["."] };

  for (const item of tree) {
    if (!item || typeof item !== "object") continue;
    const path = (item as { path?: unknown }).path;
    const type = (item as { type?: unknown }).type;
    if (typeof path !== "string") continue;
    if (type === "blob") {
      paths.push(path);
      addParentFolders(folders, path);
    }
    if (type === "tree") folders.add(path);
  }

  return { paths, folders: [...folders] };
}

function addParentFolders(folders: Set<string>, filePath: string) {
  const parts = filePath.split("/");
  parts.pop();
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    folders.add(current);
  }
}

function readDependencyNames(body: unknown) {
  if (!body || typeof body !== "object") return [];
  const file = body as { content?: unknown; encoding?: unknown };
  if (typeof file.content !== "string" || file.encoding !== "base64") return [];

  let parsed: unknown;
  try {
    const text = Buffer.from(file.content, "base64").toString("utf8");
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];

  const names = new Set<string>();
  const record = parsed as {
    dependencies?: unknown;
    devDependencies?: unknown;
  };
  for (const field of [record.dependencies, record.devDependencies]) {
    if (!field || typeof field !== "object") continue;
    for (const name of Object.keys(field)) names.add(name);
  }
  return [...names];
}

function readAccount(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const account = (body as { account?: { login?: unknown; type?: unknown } })
    .account;
  if (!account || typeof account.login !== "string" || !account.login) {
    return null;
  }
  return {
    login: account.login,
    type: typeof account.type === "string" ? account.type : "User",
  };
}

function toRepoOption(value: unknown): GithubRepoOption | null {
  if (!value || typeof value !== "object") return null;
  const repo = value as {
    id?: unknown;
    full_name?: unknown;
    private?: unknown;
    default_branch?: unknown;
  };
  if (
    typeof repo.id !== "number" ||
    typeof repo.full_name !== "string" ||
    typeof repo.private !== "boolean" ||
    typeof repo.default_branch !== "string"
  ) {
    return null;
  }
  if (!parseRepoFullName(repo.full_name)) return null;
  return {
    id: repo.id,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
  };
}

function nextLink(header: string | null) {
  if (!header) return "";
  const part = header.split(",").find((item) => item.includes('rel="next"'));
  return part?.match(/<([^>]+)>/)?.[1] ?? "";
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
