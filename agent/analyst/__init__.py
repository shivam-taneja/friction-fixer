"""Reads mock PostHog events and past verdicts, then writes one plan."""

import neatlogs

from agent.analyst.events import load_visitors
from agent.analyst.plan import choose
from agent.schemas import Plan, Verdict, VisitorData

__all__ = ["load_visitors", "write_plan"]


@neatlogs.span(kind="AGENT", name="analyst")
def write_plan(visitors: VisitorData, history: list[Verdict]) -> Plan:
    """Pick one change. Do not propose a change that was already undone."""
    return choose(visitors, history)
