import { onboardingSteps } from "@/components/onboarding/logic";
import { cn } from "@/lib/utils";

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div
      className="mb-8 flex gap-2"
      aria-label={`Step ${step + 1} of ${onboardingSteps.length}`}
    >
      {onboardingSteps.map((item, index) => (
        <span
          key={item.id}
          className={cn(
            "h-1 flex-1 rounded-full",
            index <= step ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
