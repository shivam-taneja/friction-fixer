const missingAppMessage =
  "Add GITHUB_APP_ID, GITHUB_APP_SLUG, and GITHUB_APP_PRIVATE_KEY to web/.env.";

export function githubAppConfig() {
  const appId = process.env.GITHUB_APP_ID?.trim() ?? "";
  const slug = process.env.GITHUB_APP_SLUG?.trim() ?? "";
  const privateKey = normalizePrivateKey(
    process.env.GITHUB_APP_PRIVATE_KEY ?? "",
  );

  if (!appId || !slug || !privateKey.includes("BEGIN")) {
    throw new Error(missingAppMessage);
  }

  return { appId, slug, privateKey };
}

export function githubInstallUrl(state: string) {
  const { slug } = githubAppConfig();
  const url = new URL(`https://github.com/apps/${slug}/installations/new`);
  url.searchParams.set("state", state);
  return url;
}

function normalizePrivateKey(raw: string) {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}
