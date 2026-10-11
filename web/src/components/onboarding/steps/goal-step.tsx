"use client";

import {
  analyticsLabel,
  goalChoices,
  type AnalyticsProvider,
} from "@/components/onboarding/logic";
import { folderLabel, frameworkLabel } from "@/lib/github/framework";
import type { GithubSelection } from "@/lib/github/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GoalStep({
  goal,
  onGoalChange,
  analytics,
  github,
}: {
  goal: string;
  onGoalChange: (value: string) => void;
  analytics: AnalyticsProvider;
  github: GithubSelection | null;
}) {
  const details = [
    ["Analytics", analyticsLabel(analytics)],
    ["Repository", github?.fullName || "Not connected"],
    ["Branch", github?.branch || "Not chosen"],
    [
      "Framework",
      github?.framework ? frameworkLabel(github.framework) : "Not detected",
    ],
    [
      "Source folder",
      github?.sourceFolder ? folderLabel(github.sourceFolder) : "Not chosen",
    ],
    ["Change approval", "Review before publishing"],
  ] as const;

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="project-goal">Primary goal</Label>
        <Input
          id="project-goal"
          value={goal}
          placeholder="What should the agent improve?"
          className="h-11"
          onChange={(event) => onGoalChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {goalChoices.map((choice) => {
            const selected = goal.trim() === choice;
            return (
              <Button
                key={choice}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={selected}
                className={cn(selected && "border-foreground bg-secondary")}
                onClick={() => onGoalChange(choice)}
              >
                {choice}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pick a starting point, or write your own.
        </p>
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
