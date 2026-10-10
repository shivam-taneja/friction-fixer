"""Mock visitor data. Numbers must change when the page changes."""

from agent.schemas import VisitorData


def read_visitors(page_dir: str) -> VisitorData:
    """Return mock bounce rate, scroll depth, clicks, and time on page for the current page."""
    raise NotImplementedError
