"""One round: baseline, Analyst, Builder, simulated outcome, Reviewer."""

import neatlogs

from agent.analyst import write_plan
from agent.builder import apply_plan
from agent.builder import git
from agent.builder.git import NeedsPerson
from agent.builder.github_app import installation_token
from agent.builder.sandbox import open_repo
from agent.builder.text import plan_text
from agent.history import load_saved
from agent.posthog import (
    NOT_CONNECTED,
    load_baseline as load_posthog_baseline,
    use_mock,
)
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
    except NeedsPerson as error:
        _hand_off(log, error)
    except Exception as error:
        log.fail(str(error))
        raise


@neatlogs.span(kind="WORKFLOW", name="friction-fix-round")
def continue_run(user_id: str, run_id: str) -> None:
    """Merge a pull request after a person resolved the conflict, then finish the round."""
    log = RunLog(run_id, user_id)
    try:
        _continue(user_id, log)
    except NeedsPerson as error:
        _hand_off(log, error)
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
    if use_mock(user_id):
        live = None
    else:
        live = load_posthog_baseline(user_id)
        if live is None:
            raise RuntimeError(NOT_CONNECTED)
    if live:
        before = live
        baseline_detail = _numbers(before)
    elif saved:
        before = saved
        baseline_detail = "Continued from the latest saved mock numbers.\n" + _numbers(
            before
        )
    else:
        before = generate_baseline()
        baseline_detail = "First saved numbers for this project.\n" + _numbers(before)
    log.step(
        "baseline", "Baseline", baseline_detail, {"before": _saved_numbers(before)}
    )

    box = open_repo(project, token)
    try:
        repo = box.materialize(project)
        plan = write_plan(before, history, project, repo)
        log.step("plan", "Plan", plan_text(plan), {"plan": _saved_plan(plan)})

        pr_url = apply_plan(plan, project, token, box, repo)
        _merge(pr_url, token, project.repository, undo=False)
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

        revert_url = box.undo(
            pr_url, verdict.reason, token, project.repository, project.branch
        )
        _merge(revert_url, token, project.repository, undo=True)
        log.step(
            "action",
            "Undo",
            "Opened a pull request that undoes the change, then merged it.\n"
            + revert_url,
            {"revertPullRequestUrl": revert_url},
        )
        log.finish("undone")
    finally:
        box.delete()


def _continue(user_id: str, log: RunLog) -> None:
    data = log.resume()
    project = load_project(user_id)
    token = installation_token(project.installation_id)
    verdict = data.get("verdict") if isinstance(data.get("verdict"), dict) else {}
    if verdict.get("decision") == "UNDO":
        _continue_undo(data, project, token, log, str(verdict.get("reason") or ""))
        return

    case = data.get("case")
    if case not in CASES:
        raise RuntimeError("Case must be increased or decreased.")
    pr_url = str(data.get("pullRequestUrl") or "")
    if not pr_url.startswith("https://"):
        raise RuntimeError("This run has no pull request to continue.")
    before = _stored_visitors(data.get("before"))
    change = _stored_change(data.get("plan"))
    if not before or not change:
        raise RuntimeError("This run is missing the saved plan or baseline.")

    _merge(pr_url, token, project.repository, undo=False)
    log.step(
        "pull-request",
        "Pull request",
        pr_url + "\nMerged, so the site can go live.",
        {"pullRequestUrl": pr_url},
    )
    plan = _stored_plan(data.get("plan"), change)
    after = generate_outcomes(plan.change, before)[case]
    log.step(
        "after",
        "After numbers",
        _numbers(after),
        {"after": _saved_numbers(after)},
    )
    verdict_result = review(plan.change, before, after)
    log.step(
        "verdict",
        "Verdict",
        verdict_text(verdict_result),
        {
            "verdict": {
                "decision": verdict_result.decision,
                "reason": verdict_result.reason,
                "siteCheck": verdict_result.site_check,
            }
        },
    )
    if verdict_result.decision == "KEEP":
        log.step("action", "Keep", "Kept the change. No second pull request.")
        log.finish("kept")
        return
    box = open_repo(project, token)
    try:
        revert_url = box.undo(
            pr_url, verdict_result.reason, token, project.repository, project.branch
        )
    finally:
        box.delete()
    _merge(revert_url, token, project.repository, undo=True)
    log.step(
        "action",
        "Undo",
        "Opened a pull request that undoes the change, then merged it.\n" + revert_url,
        {"revertPullRequestUrl": revert_url},
    )
    log.finish("undone")


def _continue_undo(data: dict, project, token: str, log: RunLog, reason: str) -> None:
    original = str(data.get("pullRequestUrl") or "")
    revert_url = str(data.get("revertPullRequestUrl") or "")
    if not revert_url.startswith("https://"):
        if not original.startswith("https://"):
            raise RuntimeError("This run has no pull request to undo.")
        box = open_repo(project, token)
        try:
            revert_url = box.undo(
                original, reason, token, project.repository, project.branch
            )
        finally:
            box.delete()
    _merge(revert_url, token, project.repository, undo=True)
    log.step(
        "action",
        "Undo",
        "Opened a pull request that undoes the change, then merged it.\n" + revert_url,
        {"revertPullRequestUrl": revert_url},
    )
    log.finish("undone")


def _merge(url: str, token: str, repository: str, *, undo: bool) -> None:
    try:
        git.merge_pr(url, token, repository)
    except NeedsPerson as error:
        error.undo = undo
        error.pull_request_url = url
        raise


def _hand_off(log: RunLog, error: NeedsPerson) -> None:
    url = error.pull_request_url
    detail = f"{url}\n{error}" if url.startswith("https://") else str(error)
    if error.undo:
        extra = {"revertPullRequestUrl": url} if url.startswith("https://") else None
        log.block(str(error), "action", "Undo", detail, extra)
        return
    extra = {"pullRequestUrl": url} if url.startswith("https://") else None
    log.block(str(error), "pull-request", "Pull request", detail, extra)


def _stored_visitors(value: object) -> VisitorData | None:
    if not isinstance(value, dict):
        return None
    bounce = value.get("bounceRate")
    scroll = value.get("scrollDepth")
    seconds = value.get("timeOnPage")
    visits = value.get("pricingPageVisits")
    values = (bounce, scroll, seconds, visits)
    if not all(
        isinstance(item, (int, float)) and not isinstance(item, bool) for item in values
    ):
        return None
    return VisitorData(
        bounce_rate=float(bounce),
        scroll_depth=float(scroll),
        time_on_page=float(seconds),
        pricing_page_visits=int(visits),
        source="posthog" if value.get("source") == "posthog" else "mock",
    )


def _stored_change(value: object) -> str:
    if not isinstance(value, dict):
        return ""
    change = value.get("change")
    return change.strip() if isinstance(change, str) else ""


def _stored_plan(value: object, change: str) -> Plan:
    record = value if isinstance(value, dict) else {}

    def text(key: str) -> str:
        item = record.get(key)
        return item.strip() if isinstance(item, str) else ""

    return Plan(
        problem=text("problem"),
        evidence=text("evidence"),
        change=change,
        file=text("file"),
        expected_effect=text("expectedEffect"),
    )


def _saved_numbers(visitors: VisitorData) -> dict:
    return {
        "bounceRate": visitors.bounce_rate,
        "scrollDepth": visitors.scroll_depth,
        "timeOnPage": visitors.time_on_page,
        "pricingPageVisits": visitors.pricing_page_visits,
        "source": visitors.source,
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
    return visitors.describe()
