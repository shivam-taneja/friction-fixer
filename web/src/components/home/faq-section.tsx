"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { faqs } from "@/components/home/faqs";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PageContainer
      as="section"
      id="faq"
      className="grid grid-cols-[1fr_1.2fr] gap-17.5 py-23 max-md:gap-7.5 max-md:py-16.25 max-sm:grid-cols-1 max-sm:gap-6.25"
    >
      <div>
        <div className="flex items-center gap-2 text-[11px] font-[650] tracking-[1.5px] uppercase">
          <span className="text-success">03 —</span> A few good questions
        </div>
        <h2 className="mt-4 font-display text-4xl leading-tight font-semibold max-sm:text-[31px]">
          Curious? Good.
          <br />
          So is the agent.
        </h2>
      </div>
      <div>
        {faqs.map((faq, i) => (
          <div className="border-b border-border" key={faq.question}>
            <Button
              className="h-auto w-full justify-between rounded-none px-0 py-5.5 text-left text-sm font-normal whitespace-normal hover:bg-transparent"
              variant="ghost"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              aria-expanded={openFaq === i}
              aria-controls={`faq-${i}`}
            >
              {faq.question}
              {openFaq === i ? <Minus /> : <Plus />}
            </Button>
            {openFaq === i && (
              <p
                className="pr-8.75 pb-5.75 text-[13px] leading-[1.9] text-muted-foreground"
                id={`faq-${i}`}
              >
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
