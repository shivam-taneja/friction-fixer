"""Messages the agents hand to each other. Shapes match FLOW.md."""

from dataclasses import dataclass
from typing import Literal


@dataclass
class VisitorData:
    """Mock visitor numbers. Label every result as mock."""

    bounce_rate: float
    scroll_depth: float
    pricing_page_visits: int
    time_on_page: float
    source: Literal["mock"] = "mock"


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
