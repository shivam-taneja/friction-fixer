export function parseWebsite(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (
      !url.hostname.includes(".") ||
      !["http:", "https:"].includes(url.protocol)
    ) {
      return null;
    }
    return { origin: url.origin, domain: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

export function isRepoName(value: string) {
  return /^[\w.-]+\/[\w.-]+$/.test(value.trim());
}
