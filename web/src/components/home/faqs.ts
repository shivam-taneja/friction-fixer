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
      "Yes. Each change is one pull request in your repository, with the reason written on it. The pull request is merged so the site can go live. If it conflicts, the run waits for you.",
  },
  {
    question: "What if a change makes things worse?",
    answer:
      "The change stays only if the bounce rate falls by at least 5 percentage points. Otherwise the agent opens a new pull request that reverts it. The next fix starts when you start another run.",
  },
];
