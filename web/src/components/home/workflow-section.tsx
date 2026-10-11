"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { AgentPreview, steps } from "@/components/agent/agent-preview";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkflowSection() {
  const [step, setStep] = useState(0);

  return (
    <PageContainer
      as="section"
      id="how-it-works"
      className="py-23 max-md:py-16.25"
    >
      <div className="mb-11.5 flex items-end justify-between gap-12.5 max-md:gap-6.25 max-sm:mb-5.75 max-sm:block">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-[650] tracking-[1.5px] uppercase">
            <span className="text-success">01 —</span> The feedback loop
          </div>
          <h2 className="mt-3.75 font-display text-[39px] leading-tight font-semibold max-md:text-[32px] max-sm:text-[31px]">
            From “why are they leaving?”
            <br />
            to “already fixed.”
          </h2>
        </div>
        <p className="mb-0.75 max-w-76.25 text-sm leading-[1.8] text-muted-foreground max-sm:mt-5">
          No more guessing, endless dashboards,
          <br className="hidden sm:block" /> or a backlog of “we should fix
          that.”
          <br className="hidden sm:block" /> Just a website that keeps getting
          better.
        </p>
      </div>
      <div className="grid grid-cols-[0.85fr_1.15fr] items-start gap-16.5 max-md:gap-7.5 max-sm:grid-cols-1 max-sm:gap-6.25">
        <div role="tablist" aria-label="Agent workflow">
          {steps.map((item, i) => {
            const active = step === i;
            return (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start gap-5.25 rounded-none border-b border-b-border px-0 py-5 text-left font-normal whitespace-normal text-muted-foreground hover:bg-transparent hover:text-foreground max-sm:py-4.25",
                  active && "text-foreground",
                )}
                role="tab"
                aria-selected={active}
                aria-controls="workflow-preview"
                id={`step-${i}`}
                onClick={() => setStep(i)}
              >
                <span
                  className={cn(
                    "pt-1.25 font-mono text-[11px] text-muted-foreground",
                    active && "text-success",
                  )}
                >
                  0{i + 1}
                </span>
                <span>
                  <strong className="block text-[17px] font-[550]">
                    {item.title}
                  </strong>
                  <p
                    className="mt-2.25 text-xs leading-[1.8] font-normal text-muted-foreground"
                    hidden={!active}
                  >
                    {item.description}
                  </p>
                </span>
                <ArrowRight
                  className={cn(
                    "mt-1 ml-auto opacity-0",
                    active && "opacity-100",
                  )}
                />
              </Button>
            );
          })}
        </div>
        <div
          id="workflow-preview"
          role="tabpanel"
          aria-labelledby={`step-${step}`}
        >
          <AgentPreview step={step} />
        </div>
      </div>
      <div className="mt-8.75 flex items-center justify-center gap-2.25 text-[11px] text-muted-foreground">
        <RotateCcw size={13} /> Not a one-time audit. A continuous improvement
        loop.
      </div>
    </PageContainer>
  );
}
