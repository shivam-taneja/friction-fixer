"""Compares one change with mock before and after numbers. Returns KEEP or UNDO."""

import json
from pathlib import Path

from agent.config import BOUNCE_RATE_DROP
from agent.schemas import Verdict, VisitorData

FIXTURES = Path(__file__).resolve().parent / "fixtures"
CASES = ("increased", "decreased")


def load_case(name: str) -> tuple[str, VisitorData, VisitorData]:
    """Load one temp angle: the change, the numbers before, and the numbers after."""
    if name not in CASES:
        known = " or ".join(CASES)
        raise RuntimeError(f"Case must be {known}.")
    data = json.loads((FIXTURES / f"{name}.json").read_text())
    if data.get("source") != "mock":
        raise RuntimeError("Expected mock review data.")
    change = data.get("change")
    if not isinstance(change, str) or not change.strip():
        raise RuntimeError("The mock case has no change.")
    return change.strip(), _visitors(data.get("before")), _visitors(data.get("after"))


def decide(change: str, before: VisitorData, after: VisitorData) -> Verdict:
    """KEEP when bounce rate falls by the margin in config. Otherwise UNDO.

    The verdict is what the loop acts on. The same verdict goes back to the Analyst.
    """
    change = change.strip()
    if not change:
        raise RuntimeError("The review has no change to judge.")
    drop = before.bounce_rate - after.bounce_rate
    decision = "KEEP" if drop >= BOUNCE_RATE_DROP else "UNDO"
    return Verdict(
        decision=decision,
        site_check="OK",
        numbers_before=before,
        numbers_after=after,
        reason=_reason(change, before, after, decision, drop),
    )


def verdict_text(verdict: Verdict) -> str:
    return "\n".join(
        [
            f"decision:         {verdict.decision}",
            f"site check:       {verdict.site_check}",
            f"numbers before:   {_numbers(verdict.numbers_before)}",
            f"numbers after:    {_numbers(verdict.numbers_after)}",
            f"reason:           {verdict.reason}",
        ]
    )


def _reason(
    change: str,
    before: VisitorData,
    after: VisitorData,
    decision: str,
    drop: float,
) -> str:
    margin = int(BOUNCE_RATE_DROP * 100)
    change = change.rstrip(".")
    moved = (
        f"Mock bounce rate {before.bounce_rate:.0%} -> {after.bounce_rate:.0%}. "
        f"Scroll depth {before.scroll_depth:.0%} -> {after.scroll_depth:.0%}. "
        f"Time on page {before.time_on_page:.1f}s -> {after.time_on_page:.1f}s. "
        f"Pricing page visits {before.pricing_page_visits} -> {after.pricing_page_visits}."
    )
    if decision == "KEEP":
        return (
            f"KEEP. Change: {change}. "
            f"Bounce rate fell by {drop:.0%}, at least {margin} percentage points. "
            + moved
        )
    if drop < 0:
        why = "Bounce rate got worse."
    else:
        why = f"Bounce rate did not fall by at least {margin} percentage points."
    return f"UNDO. Change: {change}. {why} {moved}"


def _numbers(visitors: VisitorData) -> str:
    return (
        f"bounce rate {visitors.bounce_rate:.0%}, "
        f"scroll depth {visitors.scroll_depth:.0%}, "
        f"pricing page visits {visitors.pricing_page_visits}"
    )


def _visitors(raw: object) -> VisitorData:
    if not isinstance(raw, dict):
        raise RuntimeError("Mock review data is missing numbers.")
    return VisitorData(
        bounce_rate=_rate(raw, "bounce_rate"),
        scroll_depth=_rate(raw, "scroll_depth"),
        pricing_page_visits=_count(raw, "pricing_page_visits"),
        time_on_page=_time(raw, "time_on_page"),
        source="mock",
    )


def _rate(raw: dict, key: str) -> float:
    value = raw.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise RuntimeError(f"Mock review data is missing {key}.")
    if not 0 <= float(value) <= 1:
        raise RuntimeError(f"{key} must be between 0 and 1.")
    return float(value)


def _count(raw: dict, key: str) -> int:
    value = raw.get(key)
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise RuntimeError(f"Mock review data is missing {key}.")
    return value


def _time(raw: dict, key: str) -> float:
    value = raw.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        raise RuntimeError(f"Mock review data is missing {key}.")
    return float(value)
