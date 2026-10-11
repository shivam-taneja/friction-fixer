"""Reads earlier runs so the next change starts from the latest saved numbers."""

from datetime import datetime

from agent.project import _client
from agent.schemas import Verdict, VisitorData


def load_saved(user_id: str, run_id: str) -> tuple[VisitorData | None, list[Verdict]]:
    """Return the latest mock numbers and the past verdicts, oldest first.

    A first project has neither. A kept run continues from its after numbers.
    An undone run continues from its before numbers, because that change was reverted.
    A run that stopped early still contributes its before numbers when nothing newer settled.
    """
    docs = list(
        _client().collection("runs").where("userId", "==", user_id).stream()
    )
    rows = []
    for doc in docs:
        if doc.id == run_id:
            continue
        data = doc.to_dict() or {}
        if data.get("status") in {"queued", "running", "blocked"}:
            continue
        rows.append(data)
    rows.sort(key=_stamp)

    history: list[Verdict] = []
    for data in rows:
        verdict = _verdict(data)
        if verdict:
            history.append(verdict)
    return _baseline(rows), history


def _baseline(rows: list[dict]) -> VisitorData | None:
    if not rows:
        return None
    latest = rows[-1]
    before = _visitors(latest.get("before"))
    after = _visitors(latest.get("after"))
    status = latest.get("status")
    if status == "kept" and after:
        return after
    if status == "undone" and before:
        return before
    return before or after


def _verdict(data: dict) -> Verdict | None:
    raw = data.get("verdict")
    if not isinstance(raw, dict):
        return None
    decision = raw.get("decision")
    if decision not in {"KEEP", "UNDO"}:
        return None
    before = _visitors(data.get("before"))
    after = _visitors(data.get("after"))
    if not before or not after:
        return None
    reason = raw.get("reason")
    site_check = raw.get("siteCheck")
    return Verdict(
        decision=decision,
        site_check=site_check.strip() if isinstance(site_check, str) and site_check.strip() else "OK",
        numbers_before=before,
        numbers_after=after,
        reason=reason.strip() if isinstance(reason, str) else "",
    )


def _visitors(value: object) -> VisitorData | None:
    if not isinstance(value, dict):
        return None
    bounce = value.get("bounceRate")
    scroll = value.get("scrollDepth")
    seconds = value.get("timeOnPage")
    visits = value.get("pricingPageVisits")
    values = (bounce, scroll, seconds, visits)
    if not all(isinstance(item, (int, float)) and not isinstance(item, bool) for item in values):
        return None
    return VisitorData(
        bounce_rate=float(bounce),
        scroll_depth=float(scroll),
        time_on_page=float(seconds),
        pricing_page_visits=int(visits),
    )


def _stamp(data: dict) -> str:
    for key in ("finishedAt", "startedAt", "createdAt"):
        value = data.get(key)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, str) and value:
            return value
    return ""
