import type { Metadata } from "next";

const ogImage = {
  url: "/friction-fixer-og.jpg",
  width: 1200,
  height: 640,
  alt: "Friction Fixer",
} as const;

function socialMetadata(
  title: string,
  description: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      type: "website",
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
};
