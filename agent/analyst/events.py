"""Mock PostHog events, summed into the visitor numbers the Analyst reads."""

import json
from pathlib import Path

from agent.schemas import VisitorData

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "events.json"
HOME = "/"
PRICING = "/pricing.html"


def load_events() -> list[dict]:
    """Read the mock PostHog export. Every event in it is labeled mock."""
    data = json.loads(FIXTURE.read_text())
    if data.get("source") != "mock" or data.get("provider") != "posthog":
        raise RuntimeError("Expected a mock PostHog export.")
    events = data.get("events")
    if not isinstance(events, list) or not events:
        raise RuntimeError("The mock PostHog export has no events.")
    return events


def load_visitors() -> VisitorData:
    """Turn the mock export into bounce rate, scroll depth, clicks, and time on page."""
    return summarize(load_events())


def summarize(events: list[dict]) -> VisitorData:
    sessions: dict[str, dict] = {}
    pricing_visits = 0
    home_scroll: list[float] = []
    home_time: list[float] = []

    for event in events:
        props = event.get("properties") or {}
        session_id = str(props.get("$session_id") or event.get("distinct_id"))
        session = sessions.setdefault(session_id, {"pages": set(), "clicked": False})
        name = event.get("event")

        if name == "$pageview":
            path = props.get("$pathname")
            session["pages"].add(path)
            if path == PRICING:
                pricing_visits += 1
        elif name == "$autocapture" and props.get("$event_type") == "click":
            session["clicked"] = True
        elif name == "$pageleave":
            left = props.get("$prev_pageview_pathname") or props.get("$pathname")
            if left != HOME:
                continue
            if "$prev_pageview_max_scroll_percentage" in props:
                home_scroll.append(float(props["$prev_pageview_max_scroll_percentage"]))
            if "$prev_pageview_duration" in props:
                home_time.append(float(props["$prev_pageview_duration"]))

    if not sessions or not home_scroll or not home_time:
        raise RuntimeError("Mock PostHog events do not cover the homepage.")

    bounced = sum(
        1
        for session in sessions.values()
        if session["pages"] <= {HOME} and not session["clicked"]
    )
    return VisitorData(
        bounce_rate=round(bounced / len(sessions), 2),
        scroll_depth=round(sum(home_scroll) / len(home_scroll) / 100, 2),
        pricing_page_visits=pricing_visits,
        time_on_page=round(sum(home_time) / len(home_time), 1),
        source="mock",
    )
