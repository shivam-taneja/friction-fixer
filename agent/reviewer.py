"""Checks the live page for real, then compares mock numbers and returns a verdict."""

from agent.schemas import Verdict, VisitorData


def review(live_url: str, before: VisitorData, after: VisitorData) -> Verdict:
    """UNDO if the page is broken or bounce rate got worse. KEEP if it fell by the margin in config."""
    raise NotImplementedError


def revert(pr_url: str, verdict: Verdict) -> None:
    """Revert the PR and send the verdict back to the Analyst on the next round."""
    raise NotImplementedError
