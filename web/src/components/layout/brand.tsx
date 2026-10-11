import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Friction Fixer home"
      className={cn(
        "flex items-center gap-2.5 text-[21px] font-[750] text-foreground no-underline max-sm:text-lg",
        className,
      )}
    >
      <Image
        src="/logo.svg"
        alt="Friction Fixer"
        width={32}
        height={32}
        className="size-8"
      />
      {!compact && (
        <span className="brand-wordmark">
          friction fixer<span className="text-success">.</span>
        </span>
      )}
    </Link>
  );
}
