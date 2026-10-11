import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";

const title = "Settings — Friction Fixer";
const description = "Your website, connections, and preferences.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SettingsPage />;
}
