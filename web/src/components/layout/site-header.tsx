import { AuthCta } from "@/components/auth/auth-cta";
import { Brand } from "@/components/layout/brand";
import { pageContainerClass } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-muted-foreground no-underline transition-colors hover:text-foreground max-md:hidden";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header
      className={cn(
        pageContainerClass,
        "flex h-22 items-center justify-between max-md:h-18.75",
      )}
    >
      <Brand />
      <nav
        className="flex items-center gap-8.5 text-[13px] max-md:gap-5"
        aria-label="Main navigation"
      >
        <a className={navLinkClass} href="#how-it-works">
          How it works
        </a>
        <a className={navLinkClass} href="#built-for-you">
          Why Friction Fixer
        </a>
        <a className={navLinkClass} href="#faq">
          FAQs
        </a>
        <AuthCta
          signedIn={signedIn}
          signedOutLabel="Meet your agent"
          variant="ink"
          className="max-sm:px-3 max-sm:text-[11px]"
        />
      </nav>
    </header>
  );
}
