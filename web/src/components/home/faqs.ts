export const faqs = [
  {
    question: "How is this different from an analytics tool?",
    answer:
      "Analytics tells you what happened. Friction Fixer closes the loop: it finds a likely cause, makes a focused code change, and checks the result in your analytics. Insights become improvements, not another dashboard to monitor.",
  },
  {
    question: "What does the agent need to get started?",
    answer:
      "Your website, access to its analytics, and the matching GitHub repository. Visitor behavior provides the signal; your repository is where the agent proposes the fix.",
  },
  {
    question: "Do I stay in control of my website?",
    answer:
      "Yes. Changes are traceable in GitHub, with a clear hypothesis and a focused pull request. The workflow is designed around reviewable changes, measurable results, and reversibility—not unexplained edits.",
  },
  {
    question: "What if a change makes things worse?",
    answer:
      "A fix is only a win if the results support it. When a change does not improve the goal, the agent rolls it back, uses what it learned, and tries another approach.",
  },
];
