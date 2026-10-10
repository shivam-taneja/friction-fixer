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
    <PageContainer as="section" id="how-it-works" className="py-[92px] max-md:py-[65px]">
      <div className="mb-[46px] flex items-end justify-between gap-[50px] max-md:gap-[25px] max-sm:mb-[23px] max-sm:block">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-[650] tracking-[1.5px] uppercase">
            <span className="text-success">01 —</span> The feedback loop
          </div>
          <h2 className="mt-[15px] font-display text-[39px] leading-[1.25] font-semibold max-md:text-[32px] max-sm:text-[31px]">
            From “why are they leaving?”
            <br />
            to “already fixed.”
          </h2>
        </div>
        <p className="mb-[3px] max-w-[305px] text-sm leading-[1.8] text-muted-foreground max-sm:mt-5">
          No more guessing, endless dashboards,
          <br className="hidden sm:block" /> or a backlog of “we should fix that.”
          <br className="hidden sm:block" /> Just a website that keeps getting better.
        </p>
      </div>
      <div className="grid grid-cols-[0.85fr_1.15fr] items-start gap-[66px] max-md:gap-[30px] max-sm:grid-cols-1 max-sm:gap-[25px]">
        <div role="tablist" aria-label="Agent workflow">
          {steps.map((item, i) => {
            const active = step === i;
            return (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start gap-[21px] rounded-none border-b border-border px-0 py-5 text-left font-normal whitespace-normal text-muted-foreground hover:bg-transparent hover:text-foreground max-sm:py-[17px]",
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
                    "pt-[5px] font-mono text-[11px] text-muted-foreground",
                    active && "text-success",
                  )}
                >
                  0{i + 1}
                </span>
                <span>
                  <strong className="block text-[17px] font-[550]">{item.title}</strong>
                  {active && (
                    <p className="mt-[9px] text-xs leading-[1.8] font-normal text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </span>
                <ArrowRight className={cn("mt-1 ml-auto opacity-0", active && "opacity-100")} />
              </Button>
            );
          })}
        </div>
        <div id="workflow-preview" role="tabpanel" aria-labelledby={`step-${step}`}>
          <AgentPreview step={step} />
        </div>
      </div>
      <div className="mt-[35px] flex items-center justify-center gap-[9px] text-[11px] text-muted-foreground">
        <RotateCcw size={13} /> Not a one-time audit. A continuous improvement loop.
      </div>
    </PageContainer>
  );
}
