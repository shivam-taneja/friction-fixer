"""Reads visitor data and past verdicts, then writes one plan."""

from agent.schemas import Plan, Verdict, VisitorData


def write_plan(visitors: VisitorData, history: list[Verdict]) -> Plan:
    """Pick one change. Do not propose a change that was already undone."""
    raise NotImplementedError
