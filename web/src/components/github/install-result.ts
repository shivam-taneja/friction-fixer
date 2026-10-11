const installResultKey = "ff-github-install-result";

let consumed = false;
let cached: { error: string | null } | null = null;

export function saveGithubInstallResult(error?: string) {
  const result = { error: error ?? null };
  consumed = true;
  cached = result;
  sessionStorage.setItem(installResultKey, JSON.stringify(result));
}

export function takeGithubInstallResult() {
  if (consumed) {
    sessionStorage.removeItem(installResultKey);
    return cached;
  }
  consumed = true;

  const raw = sessionStorage.getItem(installResultKey);
  sessionStorage.removeItem(installResultKey);
  if (!raw) {
    cached = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    cached = {
      error: typeof parsed.error === "string" ? parsed.error : null,
    };
  } catch {
    cached = null;
  }

  return cached;
}
