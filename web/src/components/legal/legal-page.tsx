import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { SiteFooter } from "@/components/layout/site-footer";
import { pageContainerClass } from "@/components/layout/page-container";
import { contactUrl, siteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function ContactLink() {
  return (
    <a
      className="text-foreground underline"
      href={contactUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      contact page
    </a>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalPage({
  title,
  description,
  path,
  updated,
  children,
}: {
  title: string;
  description: string;
  path: "/privacy" | "/terms";
  updated: string;
  children: ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${siteUrl}${path}`,
    dateModified: "2026-10-10",
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "Friction Fixer",
      url: siteUrl,
    },
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header
        className={cn(
          pageContainerClass,
          "flex h-22 items-center max-md:h-18.75",
        )}
      >
        <Brand />
      </header>
      <main className={cn(pageContainerClass, "flex-1 py-12 max-sm:py-8")}>
        <article className="max-w-3xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Go back to home
          </Link>
          <h1 className="font-display text-4xl font-semibold tracking-tight max-sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated {updated}
          </p>
          <div className="mt-10 space-y-8 text-sm leading-relaxed">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
