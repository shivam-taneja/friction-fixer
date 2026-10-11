"use client";

import { Check, GitPullRequest, ScanLine, type LucideIcon } from "lucide-react";
import { SectionTitle } from "@/components/dashboard/section-title";
import { useWorkspace } from "@/components/dashboard/use-workspace";
import { cn } from "@/lib/utils";

export function CurrentCycle({ paused }: { paused: boolean }) {
  const reviewCount = useWorkspace(
    (state) =>
      state.changes.filter((change) => change.status === "Review").length,
  );
  const steps: {
    icon: LucideIcon;
    title: string;
    detail: string;
    state: "done" | "current" | "pending";
  }[] = [
    {
      icon: Check,
      title: "Visitor behavior analyzed",
      detail: "Pricing page · 2,418 sessions",
      state: "done",
    },
    {
      icon: Check,
      title: "Friction identified",
      detail: "Primary CTA below the fold",
      state: "done",
    },
    {
      icon: GitPullRequest,
      title: reviewCount ? "Fix ready for review" : "Review complete",
      detail: "Pull request #42",
      state: "current",
    },
    {
      icon: ScanLine,
      title: "Measure the result",
      detail: paused
        ? "Waiting for agent to resume"
        : "After the change goes live",
      state: "pending",
    },
  ];

  return (
    <section>
      <SectionTitle
        title="Current cycle"
        meta={paused ? "Paused" : "In progress"}
      />
      <ol className="mt-2">
        {steps.map((step) => (
          <li
            key={step.title}
            className={cn(
              "flex gap-3 border-b border-border py-3.5 last:border-b-0",
              step.state === "pending" && "text-muted-foreground",
            )}
          >
            <step.icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                step.state === "done" && "text-success",
                step.state === "current" && "text-foreground",
                step.state === "pending" && "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-sm">{step.title}</p>
              <small className="text-xs text-muted-foreground">
                {step.detail}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
