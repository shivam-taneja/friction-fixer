export type AnalyticsProvider = "posthog" | "mixpanel" | "amplitude";

export type ProjectGoal =
  | "signup_conversion"
  | "checkout_completion"
  | "contact_form";

export const onboardingSteps = [
  {
    id: "website",
    label: "YOUR WEBSITE",
    title: "Start with your website.",
    description: "One website. One agent. A continuous loop of better.",
  },
  {
    id: "analytics",
    label: "ANALYTICS",
    title: "Where’s your visitor data?",
    description: "Choose the analytics platform you use.",
  },
  {
    id: "github",
    label: "REPOSITORY",
    title: "Give your agent a place to work.",
    description: "Choose the GitHub repository for this website.",
  },
  {
    id: "goal",
    label: "YOUR GOAL",
    title: "Ready for less friction.",
    description: "Pick a goal and review your setup.",
  },
] as const;

export const analyticsChoices: { id: AnalyticsProvider; label: string }[] = [
  { id: "posthog", label: "PostHog" },
  { id: "mixpanel", label: "Mixpanel" },
  { id: "amplitude", label: "Amplitude" },
];

export const goalChoices: { id: ProjectGoal; label: string }[] = [
  { id: "signup_conversion", label: "Signup conversion" },
  { id: "checkout_completion", label: "Checkout completion" },
  { id: "contact_form", label: "Contact form submissions" },
];

export function analyticsLabel(id: AnalyticsProvider) {
  return analyticsChoices.find((choice) => choice.id === id)?.label ?? id;
}
