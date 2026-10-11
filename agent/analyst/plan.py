"""Asks the configured model for one plan. Visitor numbers stay mock."""

import json
import re

import neatlogs
from openai import OpenAI

from agent.builder.edit import provider_settings
from agent.config import BOUNCE_RATE_DROP, DEMO_SITE_DIR, REPO_ROOT
from agent.schemas import Plan, Verdict, VisitorData

TEXT_SUFFIXES = {".html", ".css", ".js", ".svg", ".txt", ".md"}


def choose(visitors: VisitorData, history: list[Verdict]) -> Plan:
    """Ask the model for one change. It must not repeat a change already undone."""
    api_key, base_url, model = provider_settings()
    client = neatlogs.wrap(OpenAI(api_key=api_key, base_url=base_url))
    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the Analyst for a static site. "
                    "You receive mock visitor numbers and past verdicts. "
                    "Pick ONE change that should lower the bounce rate. "
                    "Return JSON only, with this shape: "
                    '{"problem":"one sentence","evidence":"the numbers",'
                    '"change":"the one change","file":"demo-site/index.html",'
                    '"expected_effect":"what should improve"}. '
                    "file must stay inside demo-site/. "
                    "Use the visitor numbers you are given. Call them mock. "
                    f"expected_effect must include a bounce-rate drop of at least "
                    f"{int(BOUNCE_RATE_DROP * 100)} percentage points. "
                    "Do not propose a change that a past UNDO verdict already rejected."
                ),
            },
            {
                "role": "user",
                "content": _brief(visitors, history),
            },
        ],
    )
    text = response.choices[0].message.content or ""
    return _parse_plan(text, visitors, history)


def _brief(visitors: VisitorData, history: list[Verdict]) -> str:
    return "\n\n".join(
        [
            "Visitor numbers:\n" + _evidence(visitors),
            "Past verdicts:\n" + _history(history),
            "Current site:\n" + _read_site(),
        ]
    )


def _evidence(visitors: VisitorData) -> str:
    return (
        f"Mock data. Bounce rate {visitors.bounce_rate:.0%}. "
        f"Average scroll depth {visitors.scroll_depth:.0%}. "
        f"Average time on page {visitors.time_on_page:.1f}s. "
        f"Pricing page visits {visitors.pricing_page_visits}."
    )


def _history(history: list[Verdict]) -> str:
    if not history:
        return "None yet."
    lines: list[str] = []
    for item in history:
        before = item.numbers_before.bounce_rate
        after = item.numbers_after.bounce_rate
        lines.append(
            f"{item.decision}. Site check: {item.site_check}. "
            f"Bounce rate {before:.0%} -> {after:.0%}. "
            f"Reason: {item.reason}"
        )
    return "\n".join(lines)


def _read_site() -> str:
    if not DEMO_SITE_DIR.exists():
        raise RuntimeError("demo-site/ does not exist yet.")
    files = [
        path
        for path in sorted(DEMO_SITE_DIR.rglob("*"))
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES
    ]
    if not files:
        raise RuntimeError("demo-site/ has no pages to plan against.")
    parts: list[str] = []
    for path in files:
        relative = path.relative_to(REPO_ROOT).as_posix()
        parts.append(f"--- {relative} ---\n{path.read_text()}")
    return "\n\n".join(parts)


def _parse_plan(text: str, visitors: VisitorData, history: list[Verdict]) -> Plan:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError("The model did not return JSON.") from error
    if not isinstance(data, dict):
        raise RuntimeError("The model did not return a plan.")

    plan = Plan(
        problem=_text(data, "problem"),
        evidence=_evidence(visitors),
        change=_text(data, "change"),
        file=_check_file(str(data.get("file", ""))),
        expected_effect=_text(data, "expected_effect"),
    )
    undone = [item.reason for item in history if item.decision == "UNDO"]
    if any(plan.change and plan.change in reason for reason in undone):
        raise RuntimeError("The model repeated a change that was already undone.")
    return plan


def _text(data: dict, key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise RuntimeError(f"The model left {key} empty.")
    return value.strip()


def _check_file(raw: str) -> str:
    parts: list[str] = []
    for part in raw.split(" and "):
        part = part.strip().replace("\\", "/")
        if not part or part.startswith("/"):
            raise RuntimeError(f"Refusing path: {part}")
        relative = part if part.startswith("demo-site/") else f"demo-site/{part}"
        path = (REPO_ROOT / relative).resolve()
        demo = DEMO_SITE_DIR.resolve()
        if path != demo and demo not in path.parents:
            raise RuntimeError(f"Refusing a file outside demo-site: {part}")
        parts.append(relative)
    if not parts:
        raise RuntimeError("The model did not name a file.")
    return " and ".join(parts)
