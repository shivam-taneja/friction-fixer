import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Friction Fixer — A website that gets better, by itself",
  description:
    "Meet the AI agent that finds visitor friction, improves your website, and measures what works.",
  openGraph: {
    title: "Friction Fixer",
    description:
      "Turn visitor behavior into better website experiences, automatically.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: { url: "/logo-bg.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        dmSans.variable,
        manrope.variable,
        "scroll-smooth scroll-pt-[100px] font-sans motion-reduce:scroll-auto",
      )}
    >
      <body>{children}</body>
    </html>
  );
}
