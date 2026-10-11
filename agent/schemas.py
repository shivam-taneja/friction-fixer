"""Messages the agents hand to each other. Shapes match FLOW.md."""

from dataclasses import dataclass
from typing import Literal


@dataclass
class VisitorData:
    """Visitor numbers from PostHog, or mock numbers when PostHog is not connected."""

    bounce_rate: float
    scroll_depth: float
    pricing_page_visits: int
    time_on_page: float
    source: Literal["mock", "posthog"] = "mock"

    def describe(self) -> str:
        if self.source == "posthog":
            lead = "PostHog, last 7 days."
            fourth = "Pageviews"
        else:
            lead = "Mock data."
            fourth = "Pricing page visits"
        return (
            f"{lead} Bounce rate {self.bounce_rate:.0%}. "
            f"Average scroll depth {self.scroll_depth:.0%}. "
            f"Average time on page {self.time_on_page:.1f}s. "
            f"{fourth} {self.pricing_page_visits}."
        )


@dataclass
class Plan:
    """Analyst → Builder."""

    problem: str
    evidence: str
    change: str
    file: str
    expected_effect: str


@dataclass
class Verdict:
    """Reviewer → Analyst."""

    decision: Literal["KEEP", "UNDO"]
    site_check: str
    numbers_before: VisitorData
    numbers_after: VisitorData
    reason: str
