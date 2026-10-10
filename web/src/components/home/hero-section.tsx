import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Play } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-162.5 overflow-hidden border-b border-border bg-hero max-sm:min-h-156.25">
      <Image
        src="/optimization-loop.jpg"
        width={1600}
        height={1008}
        priority
        className="absolute inset-0 -z-10 size-full object-cover object-[center_62%] min-[1600px]:object-[center_59%] max-sm:object-bottom dark:opacity-10"
        alt="A continuous lime-green ribbon loop flowing through glass checkpoints"
      />
      <PageContainer className="relative pt-12.25 text-center max-md:pt-14.5 max-sm:pt-10.25">
        <div className="mb-5.75 flex items-center justify-center gap-2 text-[10px] font-[650] tracking-[1.5px] uppercase max-sm:text-[9px]">
          <span className="size-1.5 rounded-full bg-success ring-4 ring-success/10" />
          Less friction. More forward.
        </div>
        <h1 className="m-0 font-display text-[68px] leading-[1.12] font-[650] max-md:text-5xl max-sm:text-[41px] max-sm:leading-[1.18]">
          Friction Fixer.
          <br />
          Your website,{" "}
          <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-0 after:h-1.25 after:-rotate-1 after:bg-primary after:content-['']">
            better by itself.
          </span>
        </h1>
        <p className="mx-auto mt-6 mb-5.75 max-w-130 text-base leading-[1.7] text-muted-foreground max-md:max-w-112.5 max-md:px-3.75 max-sm:max-w-85 max-sm:text-sm">
          The AI agent that finds what’s driving visitors away,
          <br className="hidden sm:block" /> fixes it, and checks that the fix
          actually worked.
        </p>
        <div className="flex justify-center gap-3.25 max-sm:gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/dashboard" />}
            variant="hero"
            size="lg"
            className="max-sm:px-4 max-sm:text-xs"
          >
            Meet your agent <ArrowUpRight />
          </Button>
          <Button
            nativeButton={false}
            render={<a href="#how-it-works" />}
            variant="quiet"
            size="lg"
            className="max-sm:px-4 max-sm:text-xs"
          >
            <Play size={13} /> See how it works
          </Button>
        </div>
        <p className="mt-3.5 text-[11px] text-muted-foreground">
          Your analytics. Your code. A continuous loop of better.
        </p>
      </PageContainer>
      <div className="absolute bottom-7.75 left-1/2 flex min-w-115 -translate-x-1/2 items-center gap-4.5 rounded-[7px] border border-border bg-background px-5 py-3.75 shadow-float max-sm:bottom-6 max-sm:w-[calc(100%-2.5rem)] max-sm:min-w-0 max-sm:gap-2.5 max-sm:p-3.25">
        <div className="grid size-8.5 place-items-center rounded-[5px] bg-secondary text-success">
          <Check size={18} />
        </div>
        <div>
          <p className="m-0 text-xs font-semibold max-sm:text-[11px]">
            Less friction. One fix at a time.
          </p>
          <small className="text-[10px] text-muted-foreground">
            Pricing page improvement verified
          </small>
        </div>
        <span className="ml-auto text-[13px] text-success max-sm:text-[11px]">
          +18.7% <ArrowUpRight size={13} className="inline" />
        </span>
      </div>
    </section>
  );
}
