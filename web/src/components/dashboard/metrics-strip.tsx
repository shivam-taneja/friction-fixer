import { goal, reviewCount } from "@/components/dashboard/workspace";

const metrics = [
  {
    label: goal,
    value: "3.8%",
    detail: "↑ 18.7% from baseline",
    tone: "success" as const,
  },
  {
    label: "Visitors analyzed",
    value: "2,418",
    detail: "Last 14 days",
    tone: "muted" as const,
  },
  {
    label: "Changes to review",
    value: reviewCount.toString().padStart(2, "0"),
    detail: reviewCount ? "Your approval needed" : "All caught up",
    tone: "muted" as const,
  },
];

export function MetricsStrip() {
  return (
    <div className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
        >
          <span className="text-xs text-muted-foreground">{metric.label}</span>
          <strong className="mt-1 block font-display text-3xl font-semibold tracking-tight">
            {metric.value}
          </strong>
          <small
            className={
              metric.tone === "success"
                ? "mt-1 block text-xs text-success"
                : "mt-1 block text-xs text-muted-foreground"
            }
          >
            {metric.detail}
          </small>
        </div>
      ))}
    </div>
  );
}
