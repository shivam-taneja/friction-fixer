"""Asks the model for two mock outcomes: one improved, one not."""

import json
import re
from pathlib import Path

import neatlogs
from openai import OpenAI

from agent.builder.edit import provider_settings
from agent.config import BOUNCE_RATE_DROP, REPO_ROOT
from agent.schemas import VisitorData

FIXTURES = Path(__file__).resolve().parent / "fixtures"
CASES = ("increased", "decreased")
DEFAULT_CHANGE = (
    "Add a short benefit-focused subheadline and three feature bullets on the homepage."
)


def generate_outcomes(change: str, before: VisitorData) -> dict[str, VisitorData]:
    """Ask the model for both outcomes, check them, and write the two JSON files."""
    change = change.strip()
    if not change:
        raise RuntimeError("The simulator has no change to react to.")
    mistake = ""
    last_error = "The model did not return usable mock numbers."
    for _ in range(2):
        try:
            raw = _ask(change, before, mistake)
            outcomes = _outcomes(raw, before)
        except RuntimeError as error:
            last_error = str(error)
            mistake = last_error
            continue
        _write(change, before, outcomes)
        return outcomes
    raise RuntimeError(last_error)


def _ask(change: str, before: VisitorData, mistake: str) -> dict:
    margin = int(BOUNCE_RATE_DROP * 100)
    api_key, base_url, model = provider_settings()
    client = neatlogs.wrap(OpenAI(api_key=api_key, base_url=base_url))
    correction = f"\n\nYour last answer was rejected: {mistake}" if mistake else ""
    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You simulate mock visitors after one website change. "
                    "Return JSON only, with this shape: "
                    '{"increased":{"bounce_rate":0.62,"scroll_depth":0.34,'
                    '"pricing_page_visits":7,"time_on_page":18.4},'
                    '"decreased":{"bounce_rate":0.79,"scroll_depth":0.06,'
                    '"pricing_page_visits":1,"time_on_page":4.2}}. '
                    "bounce_rate and scroll_depth are fractions from 0 to 1, not percents. "
                    "time_on_page is seconds. pricing_page_visits is a whole number. "
                    f"increased must drop bounce_rate by at least {margin} percentage points "
                    "and must raise scroll depth, time on page, and pricing visits. "
                    "decreased must raise bounce_rate and must lower the other three. "
                    "These numbers are mock."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Change: {change}\n"
                    f"Before: bounce_rate {before.bounce_rate}, "
                    f"scroll_depth {before.scroll_depth}, "
                    f"pricing_page_visits {before.pricing_page_visits}, "
                    f"time_on_page {before.time_on_page}." + correction
                ),
            },
        ],
    )
    text = (response.choices[0].message.content or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise RuntimeError("The model did not return JSON.") from error
    if not isinstance(data, dict):
        raise RuntimeError("The model did not return the two outcomes.")
    return data


def _outcomes(raw: dict, before: VisitorData) -> dict[str, VisitorData]:
    increased = _visitors(raw.get("increased"))
    decreased = _visitors(raw.get("decreased"))
    _check_increased(before, increased)
    _check_decreased(before, decreased)
    return {"increased": increased, "decreased": decreased}


def _check_increased(before: VisitorData, after: VisitorData) -> None:
    if before.bounce_rate - after.bounce_rate < BOUNCE_RATE_DROP:
        raise RuntimeError(
            "increased must drop bounce_rate by at least "
            f"{int(BOUNCE_RATE_DROP * 100)} percentage points."
        )
    if not (
        after.scroll_depth > before.scroll_depth
        and after.time_on_page > before.time_on_page
        and after.pricing_page_visits > before.pricing_page_visits
    ):
        raise RuntimeError(
            "increased must raise scroll, time on page, and pricing visits."
        )


def _check_decreased(before: VisitorData, after: VisitorData) -> None:
    if after.bounce_rate <= before.bounce_rate:
        raise RuntimeError("decreased must raise bounce_rate.")
    if not (
        after.scroll_depth < before.scroll_depth
        and after.time_on_page < before.time_on_page
        and after.pricing_page_visits < before.pricing_page_visits
    ):
        raise RuntimeError(
            "decreased must lower scroll, time on page, and pricing visits."
        )


def _write(change: str, before: VisitorData, outcomes: dict[str, VisitorData]) -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    for name, after in outcomes.items():
        payload = {
            "source": "mock",
            "change": change,
            "before": _fields(before),
            "after": _fields(after),
        }
        path = FIXTURES / f"{name}.json"
        path.write_text(json.dumps(payload, indent=2) + "\n")


def fixture_path(name: str) -> Path:
    return (FIXTURES / f"{name}.json").relative_to(REPO_ROOT)


def _fields(visitors: VisitorData) -> dict:
    return {
        "bounce_rate": visitors.bounce_rate,
        "scroll_depth": visitors.scroll_depth,
        "pricing_page_visits": visitors.pricing_page_visits,
        "time_on_page": visitors.time_on_page,
    }


def _visitors(raw: object) -> VisitorData:
    if not isinstance(raw, dict):
        raise RuntimeError("One outcome is missing its numbers.")
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
        raise RuntimeError(f"The model left {key} empty.")
    number = float(value)
    if 1 < number <= 100:
        number = number / 100
    number = round(number, 2)
    if not 0 <= number <= 1:
        raise RuntimeError(f"{key} must be between 0 and 1.")
    return number


def _count(raw: dict, key: str) -> int:
    value = raw.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        raise RuntimeError(f"The model left {key} empty.")
    if float(value) != int(value):
        raise RuntimeError(f"{key} must be a whole number.")
    return int(value)


def _time(raw: dict, key: str) -> float:
    value = raw.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        raise RuntimeError(f"The model left {key} empty.")
    return round(float(value), 1)
