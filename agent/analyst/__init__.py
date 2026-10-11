"""Reads mock PostHog events and past verdicts, then writes one plan."""

import neatlogs

from pathlib import Path

from agent.analyst.events import load_visitors
from agent.analyst.plan import choose
from agent.project import Project
from agent.schemas import Plan, Verdict, VisitorData

__all__ = ["load_visitors", "write_plan"]


@neatlogs.span(kind="AGENT", name="analyst")
def write_plan(
    visitors: VisitorData, history: list[Verdict], project: Project, repo: Path
) -> Plan:
    """Pick one change inside the project's source folder."""
    return choose(visitors, history, project, repo)
