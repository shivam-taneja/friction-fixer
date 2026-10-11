import { ChartNoAxesCombined, Layers } from "lucide-react";
import { PosthogConnect } from "@/components/posthog/posthog-connect";
import {
  analyticsChoices,
  type AnalyticsProvider,
} from "@/components/onboarding/logic";
import { Button } from "@/components/ui/button";

const icons = {
  posthog: ChartNoAxesCombined,
  mixpanel: ChartNoAxesCombined,
  amplitude: Layers,
} as const;

export function AnalyticsStep({
  onConnectedChange,
}: {
  onConnectedChange?: (connected: boolean) => void;
}) {
  return (
    <div className="grid gap-3">
      <PosthogConnect onConnectedChange={onConnectedChange} />
      {analyticsChoices
        .filter((provider) => !provider.available)
        .map((provider) => {
          const Icon = icons[provider.id];
          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              disabled
              className="h-14 w-full cursor-not-allowed justify-start px-4 text-muted-foreground disabled:opacity-100"
            >
              <Icon />
              {provider.label}
              <span className="ml-auto text-xs font-medium tracking-normal text-muted-foreground normal-case">
                Coming soon
              </span>
            </Button>
          );
        })}
    </div>
  );
}

export type { AnalyticsProvider };
