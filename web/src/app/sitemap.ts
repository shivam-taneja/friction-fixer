import type { MetadataRoute } from "next";
import { legalModified, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-10-10"),
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(legalModified),
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(legalModified),
    },
  ];
}
