import { headers } from "next/headers";

export async function isSignedIn() {
  const headerStore = await headers();
  return headerStore.get("x-signed-in") === "1";
}
