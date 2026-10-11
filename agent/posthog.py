"""Reads a connected PostHog project and turns the last 7 days into visitor numbers."""

import json
import urllib.error
import urllib.parse
import urllib.request

from agent.project import _client
from agent.schemas import VisitorData

TOKEN_URL = "https://oauth.posthog.com/oauth/token/"
CLIENT_ID = "https://friction-fixer.shivamtaneja.com/api/posthog/client"
QUERY = """
SELECT
  countIf(pageviews >= 1) AS sessions,
  countIf(pageviews = 1) AS bounced,
  avgIf(duration, pageviews >= 1) AS avg_seconds,
  avgIf(scroll, pageviews >= 1 AND scroll IS NOT NULL) AS avg_scroll,
  sum(pageviews) AS pageviews
FROM (
  SELECT
    properties.$session_id AS sid,
    countIf(event = '$pageview') AS pageviews,
    dateDiff('second', min(timestamp), max(timestamp)) AS duration,
    avgIf(
      toFloat(properties.$prev_pageview_max_scroll_percentage),
      event = '$pageleave'
    ) AS scroll
  FROM events
  WHERE timestamp > now() - INTERVAL 7 DAY
    AND notEmpty(toString(properties.$session_id))
  GROUP BY sid
)
""".strip()


NOT_CONNECTED = (
    "Connect PostHog before starting a run, or turn on mock data in Settings."
)
NOT_READY = (
    "This project needs a baseline before a run can start. "
    "Wait until PostHog has visitor data, or turn on mock data in Settings."
)


def use_mock(user_id: str) -> bool:
    """Mock data is off unless this user turned it on in Settings."""
    snap = _client().collection("users").document(user_id).get()
    data = snap.to_dict() if snap.exists else None
    return bool(data and data.get("useMockData") is True)


def readiness(user_id: str) -> dict:
    """Say whether a run may start. Mock users skip the PostHog check."""
    if use_mock(user_id):
        return {"ready": True, "mock": True}
    if not _connection(user_id):
        return {"ready": False, "mock": False, "error": NOT_CONNECTED}
    try:
        load_baseline(user_id)
    except RuntimeError as error:
        text = str(error)
        if "no pageview sessions" in text:
            return {"ready": False, "mock": False, "error": NOT_READY}
        return {"ready": False, "mock": False, "error": text}
    return {"ready": True, "mock": False}


def load_baseline(user_id: str) -> VisitorData | None:
    """Return the last 7 days from PostHog, or None when this user has not connected."""
    saved = _connection(user_id)
    if not saved:
        return None
    access, refresh = _refresh(saved["refreshToken"])
    if refresh != saved["refreshToken"]:
        _store_refresh(user_id, refresh)
    row = _query(saved["apiHost"], saved["projectId"], access)
    sessions = _number(row, 0)
    if sessions <= 0:
        raise RuntimeError("PostHog has no pageview sessions in the last 7 days.")
    bounced = _number(row, 1)
    seconds = _number(row, 2)
    scroll = _number(row, 3)
    if scroll > 1:
        scroll = scroll / 100
    pageviews = int(round(_number(row, 4)))
    return VisitorData(
        bounce_rate=min(1.0, max(0.0, bounced / sessions)),
        scroll_depth=min(1.0, max(0.0, scroll)),
        pricing_page_visits=max(0, pageviews),
        time_on_page=max(0.0, round(seconds, 1)),
        source="posthog",
    )


def _connection(user_id: str) -> dict[str, str] | None:
    snap = _client().collection("posthogConnections").document(user_id).get()
    if not snap.exists:
        return None
    data = snap.to_dict() or {}
    project_id = str(data.get("projectId") or "").strip()
    api_host = str(data.get("apiHost") or "").strip().rstrip("/")
    refresh = str(data.get("refreshToken") or "").strip()
    if not project_id or not api_host.startswith("https://") or not refresh:
        return None
    return {"projectId": project_id, "apiHost": api_host, "refreshToken": refresh}


def _refresh(refresh_token: str) -> tuple[str, str]:
    body = _form(
        TOKEN_URL,
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLIENT_ID,
        },
    )
    access = body.get("access_token")
    refresh = body.get("refresh_token") or refresh_token
    if not isinstance(access, str) or not access:
        raise RuntimeError(
            "PostHog did not refresh the connection. Connect PostHog again."
        )
    if not isinstance(refresh, str) or not refresh:
        refresh = refresh_token
    return access, refresh


def _store_refresh(user_id: str, refresh_token: str) -> None:
    _client().collection("posthogConnections").document(user_id).update(
        {"refreshToken": refresh_token}
    )


def _query(api_host: str, project_id: str, access_token: str) -> list:
    payload = json.dumps({"query": {"kind": "HogQLQuery", "query": QUERY}}).encode()
    request = urllib.request.Request(
        f"{api_host}/api/projects/{project_id}/query/",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )
    body = _read(request)
    results = body.get("results") if isinstance(body, dict) else None
    if not isinstance(results, list) or not results or not isinstance(results[0], list):
        raise RuntimeError("PostHog did not return visitor numbers.")
    return results[0]


def _form(url: str, fields: dict[str, str]) -> dict:
    request = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(fields).encode(),
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    body = _read(request)
    if not isinstance(body, dict):
        raise RuntimeError("PostHog returned an unexpected response.")
    return body


def _read(request: urllib.request.Request) -> dict | list:
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode()
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(f"PostHog refused the request. {_detail(detail)}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"PostHog could not be reached. {error.reason}") from error
    if not raw.strip():
        return {}
    parsed = json.loads(raw)
    if isinstance(parsed, (dict, list)):
        return parsed
    raise RuntimeError("PostHog returned an unexpected response.")


def _detail(raw: str) -> str:
    try:
        body = json.loads(raw)
    except json.JSONDecodeError:
        return raw.strip() or "Try connecting again."
    if isinstance(body, dict):
        for key in ("error_description", "detail", "error"):
            value = body.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return "Try connecting again."


def _number(row: list, index: int) -> float:
    if index >= len(row) or isinstance(row[index], bool) or row[index] is None:
        return 0.0
    if isinstance(row[index], (int, float)):
        return float(row[index])
    return 0.0
