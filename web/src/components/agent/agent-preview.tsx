import {
  Activity,
  Check,
  GitPullRequest,
  MousePointer2,
  RotateCcw,
  ScanLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const steps = [
  {
    title: "See where visitors get stuck.",
    description:
      "Your analytics tell a story. The agent finds the drop-offs, dead clicks, and moments that make people leave.",
  },
  {
    title: "Turn the insight into a fix.",
    description:
      "It pinpoints the friction and creates a focused change in your GitHub repository. Real code. Not another recommendation.",
  },
  {
    title: "Let the results do the talking.",
    description:
      "After the change goes live, the agent watches the same goal to see whether the experience actually improved.",
  },
  {
    title: "Keep the wins. Undo the rest.",
    description:
      "If a change doesn’t help, it gets rolled back. The agent learns from the result and tries a different approach.",
  },
];

const panels: {
  label: string;
  title: string;
  description: string;
  events: { icon: LucideIcon; label: string; value: string }[];
  result: string;
  resultValue: string;
}[] = [
  {
    label: "01 / OBSERVE",
    title: "A little friction. A lot of lost visitors.",
    description:
      "Visitors are reaching your pricing page, but the next step isn’t clear.",
    events: [
      {
        icon: Activity,
        label: "Pricing page analyzed",
        value: "2,418 sessions",
      },
      {
        icon: MousePointer2,
        label: "Visitors leaving before signup",
        value: "68.4%",
      },
      {
        icon: ScanLine,
        label: "Primary CTA below the fold",
        value: "Friction found",
      },
    ],
    result: "Next up",
    resultValue: "Create a focused fix →",
  },
  {
    label: "02 / FIX",
    title: "An insight becomes a pull request.",
    description:
      "Move the primary call to action into view and make the next step clearer.",
    events: [
      { icon: Sparkles, label: "Hypothesis created", value: "CTA visibility" },
      { icon: GitPullRequest, label: "fix/pricing-page-cta", value: "PR #42" },
      { icon: Check, label: "Checks passed", value: "Ready to review" },
    ],
    result: "Change scope",
    resultValue: "One page. One hypothesis.",
  },
  {
    label: "03 / VERIFY",
    title: "Better is a number. Not a guess.",
    description:
      "Compare signup conversion before and after the change, using your connected analytics.",
    events: [
      { icon: Activity, label: "Baseline conversion", value: "3.2%" },
      { icon: Activity, label: "Conversion after change", value: "3.8%" },
      { icon: Check, label: "Measurement window", value: "Complete" },
    ],
    result: "Relative conversion lift",
    resultValue: "+18.7% ↗",
  },
  {
    label: "04 / LEARN",
    title: "Every result makes the next fix smarter.",
    description:
      "Keep the change when it helps. Revert it when it doesn’t. Then start the next cycle.",
    events: [
      { icon: Check, label: "Pricing CTA improvement", value: "Kept" },
      { icon: RotateCcw, label: "Longer signup form", value: "Reverted" },
      { icon: Sparkles, label: "Next hypothesis", value: "Form clarity" },
    ],
    result: "Agent status",
    resultValue: "Learning. Improving. Repeating.",
  },
];

export function AgentPreview({ step }: { step: number }) {
  const panel = panels[step] ?? panels[0];

  return (
    <div className="min-h-93.25 overflow-hidden rounded-[7px] bg-ink text-ink-foreground shadow-float">
      <div className="flex items-center gap-1.75 border-b border-panel-border px-5.25 py-4.25 text-[11px]">
        <span>{panel.label}</span>
        <span className="ml-auto text-[9px] text-ink-muted">
          {panel.result}
        </span>
      </div>
      <div className="p-6.5">
        <h3 className="mt-3.75 mb-2 font-display text-[22px] font-medium">
          {panel.title}
        </h3>
        <p className="text-xs leading-[1.8] text-ink-muted">
          {panel.description}
        </p>
        {panel.events.map((event) => (
          <div
            key={event.label}
            className="flex items-center gap-2.5 border-b border-panel-border py-3.75 text-[11px]"
          >
            <event.icon className="size-3.75 text-primary" />
            <span>{event.label}</span>
            <span className="ml-auto text-[10px] text-ink-muted">
              {event.value}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-5.75 text-[11px] text-ink-muted">
          <span>{panel.result}</span>
          <strong className="text-sm font-medium text-primary">
            {panel.resultValue}
          </strong>
        </div>
      </div>
    </div>
  );
}
