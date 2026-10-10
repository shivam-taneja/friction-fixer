import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { pageContainerClass } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingHeader() {
  return (
    <header
      className={cn(
        pageContainerClass,
        "flex h-22 items-center justify-between max-md:h-18.75",
      )}
    >
      <Brand />
      <Button
        nativeButton={false}
        render={<Link href="/dashboard" />}
        variant="ghost"
      >
        Go to dashboard
        <ArrowRight />
      </Button>
    </header>
  );
}
