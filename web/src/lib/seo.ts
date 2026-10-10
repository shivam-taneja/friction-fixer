import type { Metadata } from "next";

export const siteUrl = "https://friction-fixer.shivamtaneja.com";
export const contactUrl = "https://www.shivamtaneja.com/contact";

const ogImage = {
  url: "/friction-fixer-og.jpg",
  width: 1200,
  height: 640,
  alt: "Friction Fixer",
} as const;

function socialMetadata(
  title: string,
  description: string,
  path = "/",
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Friction Fixer — A website that gets better, by itself",
  description:
    "Meet the AI agent that finds visitor friction, improves your website, and measures what works.",
  ...socialMetadata(
    "Friction Fixer",
    "Turn visitor behavior into better website experiences, automatically.",
  ),
  icons: {
    icon: { url: "/logo.svg", type: "image/svg+xml" },
  },
};

export const homeMetadata: Metadata = {
  title: "Friction Fixer — Your website, better by itself",
  description:
    "An AI agent that finds what drives visitors away, fixes your website through GitHub, and keeps only the changes that work.",
  ...socialMetadata(
    "Friction Fixer — Your website, better by itself",
    "Observe. Fix. Verify. Repeat. Turn your visitor analytics into a website that improves itself.",
  ),
  alternates: { canonical: "/" },
};

const privacyTitle = "Privacy policy — Friction Fixer";
const privacyDescription =
  "How Friction Fixer collects account data through Firebase, Google, and GitHub, the cookies we set, and your rights under India's DPDP Act, 2023.";

export const privacyMetadata: Metadata = {
  title: privacyTitle,
  description: privacyDescription,
  alternates: { canonical: "/privacy" },
  ...socialMetadata(privacyTitle, privacyDescription, "/privacy"),
  robots: { index: true, follow: true },
};

const termsTitle = "Terms of use — Friction Fixer";
const termsDescription =
  "The terms for a Friction Fixer account, including Google and GitHub sign-in, site and repository access, and automated changes to your website.";

export const termsMetadata: Metadata = {
  title: termsTitle,
  description: termsDescription,
  alternates: { canonical: "/terms" },
  ...socialMetadata(termsTitle, termsDescription, "/terms"),
  robots: { index: true, follow: true },
};
