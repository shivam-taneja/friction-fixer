import { Brand } from "@/components/layout/brand";
import { pageContainerClass } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer
      className={cn(
        pageContainerClass,
        "flex items-center justify-between py-7.5 max-sm:items-start max-sm:gap-3.75",
      )}
    >
      <Brand className="text-base max-sm:text-base" />
      <p className="text-[11px] text-muted-foreground max-sm:max-w-31.25 max-sm:text-right max-sm:leading-[1.7]">
        © 2026 Friction Fixer. Always improving.
      </p>
    </footer>
  );
}
