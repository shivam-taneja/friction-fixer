"""One local round: baseline, Analyst, Builder, simulated outcome, Reviewer."""

import neatlogs

from agent.analyst import write_plan
from agent.builder import apply_plan
from agent.builder import git
from agent.builder.text import plan_text
from agent.reviewer import review, verdict_text
from agent.schemas import VisitorData
from agent.simulator.generate import CASES, generate_baseline, generate_outcomes


@neatlogs.span(kind="WORKFLOW", name="friction-fix-round")
def run(case: str) -> None:
    """Run one round for a chosen mock outcome: increased or decreased.

    The builder pull request is merged before the review, so the site is live.
    The numbers after that are still mock. On UNDO this opens a second pull
    request that reverts the change, then merges that too.
    """
    if case not in CASES:
        raise RuntimeError("Case must be increased or decreased.")

    before = generate_baseline()
    print(_step("baseline", _numbers(before)))

    plan = write_plan(before, [])
    print(_step("plan", plan_text(plan)))

    pr_url = apply_plan(plan)
    git.merge_pr(pr_url)
    print(_step("pull request", pr_url + "\nMerged, so the site can go live."))

    after = generate_outcomes(plan.change, before)[case]
    print(_step(f"after ({case})", _numbers(after)))

    verdict = review(plan.change, before, after)
    print(_step("verdict", verdict_text(verdict)))

    if verdict.decision == "KEEP":
        print(_step("action", "Kept the change. No second pull request."))
        return

    revert_url = git.revert_pr(pr_url, verdict.reason)
    git.merge_pr(revert_url)
    print(
        _step(
            "action",
            "Opened a pull request that undoes the change, then merged it.\n"
            + revert_url
            + "\nThe verdict is what the Analyst reads on the next round.",
        )
    )


def _numbers(visitors: VisitorData) -> str:
    return (
        f"Mock data. Bounce rate {visitors.bounce_rate:.0%}. "
        f"Average scroll depth {visitors.scroll_depth:.0%}. "
        f"Average time on page {visitors.time_on_page:.1f}s. "
        f"Pricing page visits {visitors.pricing_page_visits}."
    )


def _step(title: str, body: str) -> str:
    return f"--- {title} ---\n{body}"
