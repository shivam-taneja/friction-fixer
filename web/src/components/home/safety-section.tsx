import { GitPullRequest, RotateCcw, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

const items = [
  {
    icon: GitPullRequest,
    title: "Real fixes. In your code.",
    body: "Focused pull requests in your own repository. Every change has a reason, and every line is yours to review.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence over intuition.",
    body: "The agent measures against your goals. A prettier page isn’t enough—the visitor experience needs to improve.",
  },
  {
    icon: RotateCcw,
    title: "Nothing is irreversible.",
    body: "Changes that don’t help get undone. No sunk-cost fixes. Just learning that makes the next attempt better.",
  },
];

export function SafetySection() {
  return (
    <section id="built-for-you" className="border-y border-border bg-secondary">
      <PageContainer className="py-[92px] max-md:py-[65px]">
        <div className="flex items-end justify-between gap-[50px] max-md:gap-[25px] max-sm:block">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-[650] tracking-[1.5px] uppercase">
              <span className="text-success">02 —</span> Autonomous, not unaccountable
            </div>
            <h2 className="mt-[15px] font-display text-[39px] leading-[1.25] font-semibold max-md:text-[32px] max-sm:text-[31px]">
              Works on its own.
              <br />
              Still on your terms.
            </h2>
          </div>
          <p className="mb-[3px] max-w-[305px] text-sm leading-[1.8] text-muted-foreground max-sm:mt-5">
            Let the agent do the heavy lifting.
            <br />
            Keep the visibility and control.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-[55px] max-md:gap-[25px] max-sm:grid-cols-1 max-sm:gap-8">
          {items.map((item) => (
            <div key={item.title} className="max-sm:relative max-sm:pl-[43px]">
              <item.icon className="mb-[15px] size-[23px] text-success max-sm:absolute max-sm:top-0 max-sm:left-0 max-sm:mb-0" />
              <h3 className="mb-3 font-display text-[17px] font-semibold">{item.title}</h3>
              <p className="text-[13px] leading-[1.9] text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
