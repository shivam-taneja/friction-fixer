export type ChangeStatus = "Review" | "Measuring" | "Kept" | "Reverted";

export type Change = {
  id: string;
  title: string;
  page: string;
  status: ChangeStatus;
  lift: string;
  detail: string;
};

export const goal = "Signup conversion";

export const changeFilters = [
  "All",
  "Review",
  "Measuring",
  "Kept",
  "Reverted",
] as const;

export type ChangeFilter = (typeof changeFilters)[number];

export const initialChanges: Change[] = [
  {
    id: "42",
    title: "Move primary CTA above the fold",
    page: "Pricing page",
    status: "Review",
    lift: "—",
    detail:
      "Visitors reach the pricing page, but the primary call to action sits below the fold. Moving it into view should make the next step clearer.",
  },
  {
    id: "41",
    title: "Pricing CTA improvement",
    page: "Pricing page",
    status: "Kept",
    lift: "+18.7%",
    detail:
      "The clearer pricing call to action stayed. Signup conversion rose from 3.2% to 3.8% across 2,418 sessions.",
  },
  {
    id: "40",
    title: "Clarify the plan comparison",
    page: "Pricing page",
    status: "Measuring",
    lift: "—",
    detail:
      "Plan names were easy to skim and hard to compare. This change puts the difference between plans next to the price.",
  },
  {
    id: "38",
    title: "Longer signup form",
    page: "Signup",
    status: "Reverted",
    lift: "−4.1%",
    detail:
      "Asking for more details before signup added friction. The change did not help, so it was reverted.",
  },
];
