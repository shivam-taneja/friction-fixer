"""Compares one change with before and after numbers. Returns KEEP or UNDO."""

from agent.config import BOUNCE_RATE_DROP
from agent.schemas import Verdict, VisitorData


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
    source = "PostHog" if before.source == "posthog" else "Mock"
    fourth = "Pageviews" if before.source == "posthog" else "Pricing page visits"
    moved = (
        f"{source} bounce rate {before.bounce_rate:.0%} -> {after.bounce_rate:.0%}. "
        f"Scroll depth {before.scroll_depth:.0%} -> {after.scroll_depth:.0%}. "
        f"Time on page {before.time_on_page:.1f}s -> {after.time_on_page:.1f}s. "
        f"{fourth} {before.pricing_page_visits} -> {after.pricing_page_visits}."
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
        f"{'pageviews' if visitors.source == 'posthog' else 'pricing page visits'} "
        f"{visitors.pricing_page_visits}"
    )
