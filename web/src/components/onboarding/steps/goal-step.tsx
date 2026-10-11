"use client";

import {
  analyticsLabel,
  goalChoices,
  type AnalyticsProvider,
  type ProjectGoal,
} from "@/components/onboarding/logic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function GoalStep({
  goal,
  onGoalChange,
  site,
  analytics,
  repo,
}: {
  goal: ProjectGoal;
  onGoalChange: (value: ProjectGoal) => void;
  site: string;
  analytics: AnalyticsProvider;
  repo: string;
}) {
  const details = [
    ["Website", site],
    ["Analytics", analyticsLabel(analytics)],
    ["Repository", repo],
    ["Change approval", "Review before publishing"],
  ] as const;

  const selectedGoal = goalChoices.find((choice) => choice.id === goal);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="project-goal">Primary goal</Label>

        <Select
          value={goal}
          onValueChange={(value) => onGoalChange(value as ProjectGoal)}
        >
          <SelectTrigger id="project-goal" className="w-full">
            <SelectValue placeholder="Select a goal">
              {selectedGoal?.label ?? "Select a goal"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {goalChoices.map((choice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          {details.map(([label, value], index) => (
            <div
              key={label}
              className={`flex items-baseline justify-between gap-4 px-4 py-3 text-sm ${
                index !== details.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="text-muted-foreground">{label}</span>
              <strong className="text-right font-medium">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
