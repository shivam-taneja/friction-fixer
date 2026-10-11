"""Looks at one change and the mock numbers, then returns KEEP or UNDO."""

import neatlogs

from agent.reviewer.verdict import decide, load_case, verdict_text
from agent.schemas import Verdict, VisitorData

__all__ = ["load_case", "review", "verdict_text"]


@neatlogs.span(kind="AGENT", name="reviewer")
def review(change: str, before: VisitorData, after: VisitorData) -> Verdict:
    """Return a verdict the loop can act on. Pass that same verdict back to the Analyst."""
    return decide(change, before, after)
