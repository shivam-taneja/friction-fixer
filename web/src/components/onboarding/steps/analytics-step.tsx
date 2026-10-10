import { ChartNoAxesCombined, Check, Layers } from "lucide-react";
import {
  analyticsChoices,
  type AnalyticsProvider,
} from "@/components/onboarding/logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons = {
  posthog: ChartNoAxesCombined,
  mixpanel: ChartNoAxesCombined,
  amplitude: Layers,
} as const;

export function AnalyticsStep({
  analytics,
  onAnalyticsChange,
}: {
  analytics: AnalyticsProvider;
  onAnalyticsChange: (value: AnalyticsProvider) => void;
}) {
  return (
    <div className="grid gap-3">
      {analyticsChoices.map((provider) => {
        const selected = analytics === provider.id;
        const Icon = icons[provider.id];
        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            aria-pressed={selected}
            className={cn(
              "h-14 w-full justify-start px-4",
              selected && "border-foreground bg-secondary",
            )}
            onClick={() => onAnalyticsChange(provider.id)}
          >
            <Icon />
            {provider.label}
            {selected && <Check className="ml-auto" />}
          </Button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Your choice is saved on this project. Connecting the account comes
        later.
      </p>
    </div>
  );
}
