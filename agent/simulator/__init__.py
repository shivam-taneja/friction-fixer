"""Mock visitor numbers. The model writes one improved outcome and one worse outcome."""

from agent.analyst.events import load_visitors
from agent.schemas import VisitorData
from agent.simulator.generate import CASES, DEFAULT_CHANGE, generate_outcomes

__all__ = ["read_outcome"]


def read_outcome(
    case: str, change: str | None = None
) -> tuple[str, VisitorData, VisitorData]:
    """Ask the model for both outcomes and return one of them.

    The Reviewer calls this. It does not read the JSON files itself.
    """
    if case not in CASES:
        raise RuntimeError("Case must be increased or decreased.")
    used = (change or DEFAULT_CHANGE).strip()
    before = load_visitors()
    outcomes = generate_outcomes(used, before)
    return used, before, outcomes[case]
