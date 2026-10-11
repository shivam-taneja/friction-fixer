import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/overview";

const title = "Overview — Friction Fixer";
const description =
  "Follow your agent’s progress, conversion trends, and recent website improvements.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description: "Your website improvements, at a glance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Your website improvements, at a glance.",
  },
};

export default function Page() {
  return <DashboardOverview />;
}
