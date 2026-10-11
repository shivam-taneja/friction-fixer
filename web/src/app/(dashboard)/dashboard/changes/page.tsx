import type { Metadata } from "next";
import { ChangesPage } from "@/components/dashboard/changes-page";

const title = "Changes — Friction Fixer";
const description =
  "Review proposed fixes, follow measurements, and keep or revert website changes.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description: "Every fix, its hypothesis, and its result.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Every fix, its hypothesis, and its result.",
  },
};

export default function Page() {
  return <ChangesPage />;
}
