import type {
  AnalyticsChoice,
  GoalChoice,
} from "@/components/onboarding/logic";
import { goalChoices } from "@/components/onboarding/logic";

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GoalStep({
  goal,
  onGoalChange,
  site,
  analytics,
  repo,
}: {
  goal: GoalChoice;
  onGoalChange: (value: GoalChoice) => void;
  site: string;
  analytics: AnalyticsChoice;
  repo: string;
}) {
  return (
    <div className="grid gap-6">
      <label className="grid text-sm font-medium">
        Primary goal
        <select
          className={inputClass}
          value={goal}
          onChange={(event) => onGoalChange(event.target.value as GoalChoice)}
        >
          {goalChoices.map((choice) => (
            <option key={choice}>{choice}</option>
          ))}
        </select>
      </label>
      <div className="divide-y divide-border rounded-lg border border-border">
        {(
          [
            ["Website", site],
            ["Analytics", analytics],
            ["Repository", repo],
            ["Change approval", "Review before publishing"],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <strong className="text-right font-semibold">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
