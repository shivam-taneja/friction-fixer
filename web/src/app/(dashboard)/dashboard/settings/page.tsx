import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";
import { noIndex } from "@/lib/seo";

const title = "Settings — Friction Fixer";
const description = "Your website, connections, and preferences.";

export const metadata: Metadata = {
  title,
  description,
  robots: noIndex,
};

export default function Page() {
  return <SettingsPage />;
}
