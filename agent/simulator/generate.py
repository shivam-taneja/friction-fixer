"""Asks the model for two mock outcomes: one improved, one not."""

import json
import re

import neatlogs
from openai import OpenAI

from agent.builder.edit import provider_settings
from agent.config import BOUNCE_RATE_DROP
from agent.schemas import VisitorData

CASES = ("increased", "decreased")


def generate_baseline() -> VisitorData:
    """Ask the model for the mock numbers from before any edit."""
    mistake = ""
    last_error = "The model did not return a usable baseline."
    for _ in range(2):
        try:
            visitors = _baseline(_ask_baseline(mistake))
        except RuntimeError as error:
            last_error = str(error)
            mistake = last_error
            continue
        return visitors
    raise RuntimeError(last_error)


def generate_outcomes(change: str, before: VisitorData) -> dict[str, VisitorData]:
    """Ask the model for both outcomes and check them."""
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
        return outcomes
    raise RuntimeError(last_error)


def _ask_baseline(mistake: str) -> dict:
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
                    "You simulate a first batch of mock PostHog numbers for a homepage "
                    "where most visitors leave. Return one JSON object with the keys "
                    "bounce_rate, scroll_depth, pricing_page_visits, and time_on_page. "
                    "Choose a fresh set inside the ranges below. "
                    "bounce_rate and scroll_depth are fractions from 0 to 1, not percents. "
                    "bounce_rate must be from 0.65 to 0.90. "
                    "scroll_depth must be from 0.05 to 0.25. "
                    "time_on_page must be from 3 to 12 seconds. "
                    "pricing_page_visits must be a whole number from 1 to 4. "
                    "These numbers are mock."
                ),
            },
            {"role": "user", "content": "Write the starting numbers." + correction},
        ],
    )
    return _json_object(response.choices[0].message.content or "")


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
    return _json_object(response.choices[0].message.content or "")


def _json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError("The model did not return JSON.") from error
    if not isinstance(data, dict):
        raise RuntimeError("The model did not return JSON.")
    return data


def _baseline(raw: dict) -> VisitorData:
    numbers = raw.get("baseline") if isinstance(raw.get("baseline"), dict) else raw
    visitors = _visitors(numbers)
    if not 0.65 <= visitors.bounce_rate <= 0.90:
        raise RuntimeError("baseline bounce_rate must be from 0.65 to 0.90.")
    if not 0.05 <= visitors.scroll_depth <= 0.25:
        raise RuntimeError("baseline scroll_depth must be from 0.05 to 0.25.")
    if not 3 <= visitors.time_on_page <= 12:
        raise RuntimeError("baseline time_on_page must be from 3 to 12.")
    if not 1 <= visitors.pricing_page_visits <= 4:
        raise RuntimeError("baseline pricing_page_visits must be from 1 to 4.")
    return visitors


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
