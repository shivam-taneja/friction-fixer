import type { Metadata } from "next";

export const siteUrl = "https://friction-fixer.shivamtaneja.com";
export const contactUrl = "https://www.shivamtaneja.com/contact";

export const homeTitle = "Friction Fixer — Your website, better by itself";
export const homeDescription =
  "An AI agent that finds what drives visitors away, fixes your website through GitHub, and keeps only the changes that work.";

/** Visible "Last updated" date on /privacy and /terms. */
export const legalModified = "2026-10-12";

export const noIndex: Metadata["robots"] = { index: false, follow: false };

const ogImage = {
  url: "/friction-fixer-og.jpg",
  width: 1200,
  height: 640,
  alt: "Friction Fixer. Your website, better by itself.",
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
      siteName: "Friction Fixer",
      type: "website",
      url: path,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: homeTitle,
  description: homeDescription,
  ...socialMetadata(homeTitle, homeDescription),
  icons: {
    icon: { url: "/logo.svg", type: "image/svg+xml" },
  },
};

export const homeMetadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  ...socialMetadata(homeTitle, homeDescription),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Friction Fixer",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 160,
        height: 160,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Friction Fixer",
      url: siteUrl,
      description: homeDescription,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: homeTitle,
      description: homeDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}/friction-fixer-og.jpg`,
      },
    },
  ],
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

const pricingTitle = "Pricing — Friction Fixer";
const pricingDescription =
  "Start free with one run, or use Pro at $29 a month for four runs. Team and custom plans are not on sale yet.";

export const pricingMetadata: Metadata = {
  title: pricingTitle,
  description: pricingDescription,
  alternates: { canonical: "/pricing" },
  ...socialMetadata(pricingTitle, pricingDescription, "/pricing"),
  robots: { index: true, follow: true },
};
