"""One round: baseline, Analyst, Builder, simulated outcome, Reviewer."""

import neatlogs

from agent.analyst import write_plan
from agent.builder import apply_plan
from agent.builder import git
from agent.builder.github_app import installation_token
from agent.builder.text import plan_text
from agent.history import load_saved
from agent.progress import RunLog
from agent.project import load_project
from agent.reviewer import review, verdict_text
from agent.schemas import Plan, VisitorData
from agent.simulator.generate import CASES, generate_baseline, generate_outcomes


@neatlogs.span(kind="WORKFLOW", name="friction-fix-round")
def run(case: str, user_id: str, run_id: str) -> None:
    """Run one round for a chosen mock outcome: increased or decreased.

    The builder pull request is merged before the review, so the site is live.
    The numbers after that are still mock. On UNDO this opens a second pull
    request that reverts the change, then merges that too. Each step is saved
    on the run document.
    """
    log = RunLog(run_id, user_id)
    try:
        _round(case, user_id, log)
    except Exception as error:
        log.fail(str(error))
        raise


def _round(case: str, user_id: str, log: RunLog) -> None:
    if case not in CASES:
        raise RuntimeError("Case must be increased or decreased.")

    log.start(case)
    project = load_project(user_id)
    log.step(
        "project",
        "Project",
        f"{project.repository} ({project.branch})\n"
        f"Folder: {project.root_label()}\n"
        f"Goal: {project.goal}",
    )

    token = installation_token(project.installation_id)
    saved, history = load_saved(user_id, log.run_id)
    if saved:
        before = saved
        baseline_detail = "Continued from the latest saved mock numbers.\n" + _numbers(before)
    else:
        before = generate_baseline()
        baseline_detail = "First saved numbers for this project.\n" + _numbers(before)
    log.step("baseline", "Baseline", baseline_detail, {"before": _saved_numbers(before)})

    plan = write_plan(before, history, project)
    log.step("plan", "Plan", plan_text(plan), {"plan": _saved_plan(plan)})

    pr_url = apply_plan(plan, project, token)
    git.merge_pr(pr_url, token, project.repository)
    log.step(
        "pull-request",
        "Pull request",
        pr_url + "\nMerged, so the site can go live.",
        {"pullRequestUrl": pr_url},
    )

    after = generate_outcomes(plan.change, before)[case]
    log.step(
        "after",
        "After numbers",
        _numbers(after),
        {"after": _saved_numbers(after)},
    )

    verdict = review(plan.change, before, after)
    log.step(
        "verdict",
        "Verdict",
        verdict_text(verdict),
        {
            "verdict": {
                "decision": verdict.decision,
                "reason": verdict.reason,
                "siteCheck": verdict.site_check,
            }
        },
    )

    if verdict.decision == "KEEP":
        log.step("action", "Keep", "Kept the change. No second pull request.")
        log.finish("kept")
        return

    revert_url = git.revert_pr(
        pr_url, verdict.reason, token, project.repository, project.branch
    )
    git.merge_pr(revert_url, token, project.repository)
    log.step(
        "action",
        "Undo",
        "Opened a pull request that undoes the change, then merged it.\n" + revert_url,
        {"revertPullRequestUrl": revert_url},
    )
    log.finish("undone")


def _saved_numbers(visitors: VisitorData) -> dict:
    return {
        "bounceRate": visitors.bounce_rate,
        "scrollDepth": visitors.scroll_depth,
        "timeOnPage": visitors.time_on_page,
        "pricingPageVisits": visitors.pricing_page_visits,
    }


def _saved_plan(plan: Plan) -> dict:
    return {
        "problem": plan.problem,
        "evidence": plan.evidence,
        "change": plan.change,
        "file": plan.file,
        "expectedEffect": plan.expected_effect,
    }


def _numbers(visitors: VisitorData) -> str:
    return (
        f"Mock data. Bounce rate {visitors.bounce_rate:.0%}. "
        f"Average scroll depth {visitors.scroll_depth:.0%}. "
        f"Average time on page {visitors.time_on_page:.1f}s. "
        f"Pricing page visits {visitors.pricing_page_visits}."
    )
