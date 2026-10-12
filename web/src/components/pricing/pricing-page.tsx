"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    detail:
      "One project at a time. One lifetime run, its scheduled check, and any required revert. No extra edits.",
    action: "Start free",
    featured: false,
    waitlist: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    detail:
      "Four runs each billing month, the customization already in the product, and top-ups when you need more runs. One project at a time.",
    action: "Buy Pro",
    featured: true,
    waitlist: false,
  },
  {
    name: "Team",
    price: "$149",
    cadence: "per month",
    detail:
      "Planned: 20 shared runs a month, up to 10 projects, and collaboration. Checkout is not open.",
    action: "Join waitlist",
    featured: false,
    waitlist: true,
  },
] as const;

const extras = [
  {
    name: "Top-up",
    price: "$19",
    cadence: "once",
    detail: "Three additional runs, for paid customers only.",
    action: "Buy 3 more runs",
  },
  {
    name: "Custom",
    price: "From $3,000",
    cadence: "per month",
    detail: "Usage and support scoped for that customer.",
    action: "Contact us",
  },
] as const;

const rules = [
  "One run includes planning, editing, the scheduled check, and any revert.",
  "A change that is reverted still uses that run. The work was delivered and checked.",
  "A failure before a pull request exists gives the run back.",
  "Included monthly runs do not roll over. Purchased top-ups last while the paid plan stays active.",
  "Every new edit needs Start run. The agent does not start the next edit on its own.",
  "One unresolved change at a time.",
  "The default check wait is 7 days, starting after the change is merged.",
];

export function PricingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main>
        <PageContainer as="section" className="py-16 max-sm:py-10">
          <p className="text-[11px] font-[650] tracking-[1.5px] text-success uppercase">
            Pricing
          </p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-tight font-semibold max-sm:text-4xl">
            Start free. Pay when a run is worth it.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            Free includes one run. Pro is four runs a month. Team is on the
            waitlist.
          </p>
          <div className="mt-10 grid items-stretch gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-5",
                  plan.featured && "border-primary shadow-float",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    {plan.name}
                  </h2>
                  {plan.featured ? <Badge>Recommended</Badge> : null}
                  {plan.waitlist ? (
                    <Badge variant="outline">Coming soon</Badge>
                  ) : null}
                </div>
                <p className="mt-4 font-display text-4xl font-semibold">
                  {plan.price}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    {plan.cadence}
                  </span>
                </p>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {plan.detail}
                </p>
                <PlanButton
                  signedIn={signedIn}
                  featured={plan.featured}
                  className="mt-6"
                >
                  {plan.action}
                </PlanButton>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {extras.map((extra) => (
              <article
                key={extra.name}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold">
                    {extra.name}
                  </h2>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {extra.price}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      {extra.cadence}
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {extra.detail}
                  </p>
                </div>
                <PlanButton signedIn={signedIn} className="sm:w-auto">
                  {extra.action}
                </PlanButton>
              </article>
            ))}
          </div>
        </PageContainer>
        <section className="border-t bg-secondary">
          <PageContainer className="py-14 max-sm:py-10">
            <h2 className="font-display text-2xl font-semibold">
              How a run is counted
            </h2>
            <ul className="mt-5 grid max-w-3xl gap-3 text-sm leading-6 text-muted-foreground">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </PageContainer>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PlanButton({
  signedIn,
  featured = false,
  className,
  children,
}: {
  signedIn: boolean;
  featured?: boolean;
  className?: string;
  children: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={featured ? "default" : "outline"}
      className={cn("w-full cursor-pointer", className)}
      onClick={() => {
        if (!signedIn) {
          router.push("/auth");
          return;
        }
        notify.message("Coming soon.");
      }}
    >
      {children}
    </Button>
  );
}
