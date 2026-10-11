"""Looks at one change and the mock numbers, then returns KEEP or UNDO."""

import neatlogs

from agent.reviewer.verdict import decide, verdict_text
from agent.schemas import Verdict, VisitorData
from agent.simulator import read_outcome

__all__ = ["review", "review_case", "verdict_text"]


@neatlogs.span(kind="AGENT", name="reviewer")
def review(change: str, before: VisitorData, after: VisitorData) -> Verdict:
    """Return a verdict the loop can act on. Pass that same verdict back to the Analyst."""
    return decide(change, before, after)


def review_case(case: str, change: str | None = None) -> Verdict:
    """Ask the simulator for one outcome, then judge it."""
    used, before, after = read_outcome(case, change)
    return review(used, before, after)
