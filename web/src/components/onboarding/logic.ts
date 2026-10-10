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

export const analyticsChoices = ["PostHog", "Mixpanel", "Amplitude"] as const;
export const goalChoices = [
  "Signup conversion",
  "Checkout completion",
  "Contact form submissions",
] as const;

export type AnalyticsChoice = (typeof analyticsChoices)[number];
export type GoalChoice = (typeof goalChoices)[number];
export type OwnershipMethod = "file" | "dns";

const completeKey = "ff-onboarding-mock-complete";

export function parseWebsite(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (
      !url.hostname.includes(".") ||
      !["http:", "https:"].includes(url.protocol)
    ) {
      return null;
    }
    return { origin: url.origin, domain: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

export function verificationToken(domain: string) {
  return `ff_${domain.replace(/\./g, "_")}`;
}

export function isRepoName(value: string) {
  return /^[\w.-]+\/[\w.-]+$/.test(value.trim());
}

export function markOnboardingComplete() {
  localStorage.setItem(completeKey, "1");
}

export function isOnboardingComplete() {
  return localStorage.getItem(completeKey) === "1";
}
