import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-primary px-5 py-[70px] text-center text-primary-foreground">
      <h2 className="mb-[17px] font-display text-[40px] leading-[1.2] font-semibold max-sm:text-[31px]">
        Your next improvement
        <br />
        shouldn’t wait on your to-do list.
      </h2>
      <p className="mb-[27px] text-sm">Give your website an agent that closes the loop.</p>
      <Button nativeButton={false} render={<Link href="/dashboard" />} variant="ink" size="lg">
        Meet Friction Fixer <ArrowUpRight />
      </Button>
    </section>
  );
}
