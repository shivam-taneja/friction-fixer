import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Brand({ className }: { className?: string }) {
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
        src="/logo-bg.svg"
        alt="Friction Fixer"
        width={32}
        height={32}
        className="size-8"
      />
      <span>
        friction fixer<span className="text-success">.</span>
      </span>
    </Link>
  );
}
