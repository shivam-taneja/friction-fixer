import { ChartNoAxesCombined, Check, Layers } from "lucide-react";
import type { AnalyticsChoice } from "@/components/onboarding/logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const providers: { name: AnalyticsChoice; icon: typeof Layers }[] = [
  { name: "PostHog", icon: ChartNoAxesCombined },
  { name: "Mixpanel", icon: ChartNoAxesCombined },
  { name: "Amplitude", icon: Layers },
];

export function AnalyticsStep({
  analytics,
  onAnalyticsChange,
}: {
  analytics: AnalyticsChoice;
  onAnalyticsChange: (value: AnalyticsChoice) => void;
}) {
  return (
    <div className="grid gap-3">
      {providers.map((provider) => {
        const selected = analytics === provider.name;
        return (
          <Button
            key={provider.name}
            type="button"
            variant="outline"
            aria-pressed={selected}
            className={cn(
              "h-14 w-full justify-start px-4",
              selected && "border-foreground bg-secondary",
            )}
            onClick={() => onAnalyticsChange(provider.name)}
          >
            <provider.icon />
            {provider.name}
            {selected && <Check className="ml-auto" />}
          </Button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        The connection is simulated for now. Pick the platform you use.
      </p>
    </div>
  );
}
