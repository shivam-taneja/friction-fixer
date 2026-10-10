import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";

export const metadata: Metadata = {
  title: "Friction Fixer — Your website, better by itself",
  description:
    "An AI agent that finds what drives visitors away, fixes your website through GitHub, and keeps only the changes that work.",
  openGraph: {
    title: "Friction Fixer — Your website, better by itself",
    description:
      "Observe. Fix. Verify. Repeat. Turn your visitor analytics into a website that improves itself.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Page() {
  return <HomePage />;
}
