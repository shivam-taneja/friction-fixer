import { lookup, resolveTxt } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateAddress(address: string) {
  if (address.includes(":")) {
    const head = address.toLowerCase().split(":")[0] ?? "";
    const value = Number.parseInt(head, 16);
    return (
      address === "::1" ||
      head.startsWith("fc") ||
      head.startsWith("fd") ||
      (value >= 0xfe80 && value <= 0xfebf)
    );
  }

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export async function assertPublicDomain(domain: string) {
  const host = domain.toLowerCase();
  if (
    host.length > 253 ||
    !/^[a-z0-9.-]+$/.test(host) ||
    isIP(host) ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("That domain can't be checked.");
  }

  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("We couldn't find that domain.");
  }

  if (
    records.length === 0 ||
    records.some((record) => isPrivateAddress(record.address))
  ) {
    throw new Error("That domain can't be checked.");
  }
}

const filePath = "/.well-known/friction-fixer.txt";

async function fetchVerificationFile(url: string, domain: string, hops: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        accept: "text/plain",
        "user-agent": "FrictionFixer-Verifier",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      if (hops < 1) return null;
      const location = response.headers.get("location");
      if (!location) return null;
      const next = new URL(location, url);
      const host = next.hostname.replace(/^www\./, "");
      if (
        next.protocol !== "https:" ||
        host !== domain ||
        next.pathname.replace(/\/$/, "") !== filePath
      ) {
        return null;
      }
      return fetchVerificationFile(next.toString(), domain, hops - 1);
    }

    if (response.status < 200 || response.status >= 300) return null;
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fileHasToken(domain: string, token: string) {
  const response = await fetchVerificationFile(
    `https://${domain}${filePath}`,
    domain,
    1,
  );
  if (!response) return false;
  const text = await response.text();
  if (text.length > 2048) return false;
  return text.split(/\r?\n/).some((line) => line.trim() === token);
}

export async function dnsHasToken(domain: string, token: string) {
  try {
    const records = await resolveTxt(`_friction-fixer.${domain}`);
    return records.some((chunks) => chunks.join("") === token);
  } catch {
    return false;
  }
}
