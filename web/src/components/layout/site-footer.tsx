import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { pageContainerClass } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer
      className={cn(
        pageContainerClass,
        "flex items-center justify-between gap-6 py-7.5 max-sm:flex-col max-sm:items-start max-sm:gap-3.75",
      )}
    >
      <Brand className="text-base max-sm:text-base" />
      <nav aria-label="Legal" className="flex gap-4 text-[11px]">
        <Link
          href="/privacy"
          className="text-muted-foreground no-underline hover:text-foreground"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="text-muted-foreground no-underline hover:text-foreground"
        >
          Terms
        </Link>
      </nav>
      <p className="text-[11px] text-muted-foreground max-sm:leading-[1.7]">
        © 2026 Friction Fixer. Always improving.
      </p>
    </footer>
  );
}
