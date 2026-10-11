import * as z from "zod";

export type AnalyticsProvider = "posthog" | "mixpanel" | "amplitude";

export const projectGoalSchema = z
  .string()
  .trim()
  .min(1, "Write a goal before continuing.")
  .max(120, "Keep the goal under 120 characters.")
  .check(
    z.refine(
      async (goal) => goal.length >= 3,
      "Write a goal of at least 3 characters.",
    ),
    z.refine(async (goal) => /\p{L}/u.test(goal), "Write a goal in words."),
  );

export type ProjectGoal = z.infer<typeof projectGoalSchema>;

export async function parseProjectGoal(value: string) {
  const result = await projectGoalSchema.safeParseAsync(value);
  if (result.success) return { ok: true as const, goal: result.data };
  return {
    ok: false as const,
    error: result.error.issues[0]?.message ?? "Write a goal before continuing.",
  };
}

export const onboardingSteps = [
  {
    id: "analytics",
    label: "ANALYTICS",
    title: "Where’s your visitor data?",
    description:
      "Connect your analytics to help your agent identify friction points.",
  },
  {
    id: "github",
    label: "REPOSITORY",
    title: "Give your agent a place to work.",
    description:
      "Connect the GitHub repository your agent can use to make changes.",
  },
  {
    id: "goal",
    label: "YOUR GOAL",
    title: "Ready for less friction.",
    description:
      "Choose what to improve and review your setup before getting started.",
  },
] as const;

export const analyticsChoices: {
  id: AnalyticsProvider;
  label: string;
  available: boolean;
}[] = [
  { id: "posthog", label: "PostHog", available: true },
  { id: "mixpanel", label: "Mixpanel", available: false },
  { id: "amplitude", label: "Amplitude", available: false },
];

export const goalChoices = [
  "Signup conversion",
  "Checkout completion",
  "Contact form submissions",
] as const;

export function analyticsLabel(id: AnalyticsProvider) {
  return analyticsChoices.find((choice) => choice.id === id)?.label ?? id;
}
