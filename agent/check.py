"""Finish live runs whose PostHog check date has passed.

Run this on a schedule: python -m agent.check
"""

from datetime import datetime, timedelta, timezone

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from agent.builder.sandbox import WAIT_MESSAGE
from agent.loop import _stored_change, _stored_visitors, settle_live
from agent.posthog import NOT_CONNECTED, load_window
from agent.progress import RunLog, _now
from agent.project import _client
from agent.tracing import flush_tracing, init_tracing

STALE_AFTER = timedelta(minutes=45)
_FATAL = (
    "No project is saved",
    "No GitHub installation",
    "does not match the project",
    "has no sourceFolder",
    "missing installationId",
    "Set GITHUB_APP_ID",
    "Set DAYTONA_API_KEY",
    NOT_CONNECTED,
)


class Incomplete(RuntimeError):
    """The run can never be checked. Mark it failed."""


def main() -> None:
    init_tracing()
    try:
        check_due()
    finally:
        flush_tracing()


def check_due() -> None:
    """Claim each due live run, read its check window, then KEEP or UNDO."""
    client = _client()
    now = datetime.now(timezone.utc)
    found = False
    query = client.collection("runs").where(
        filter=FieldFilter("status", "in", ["measuring", "running"])
    )
    for snap in query.stream():
        data = snap.to_dict() or {}
        if not _candidate(data, now):
            continue
        found = True
        try:
            _check_run(client, snap.id)
        except Exception as error:
            print(f"{snap.id}: {error}")
    if not found:
        print("No runs are due for a PostHog check.")


def _check_run(client, run_id: str) -> None:
    claimed = _claim(client, run_id)
    if not claimed:
        return
    user_id = str(claimed.get("userId") or "").strip()
    if not user_id:
        client.collection("runs").document(run_id).update(
            {
                "status": "failed",
                "error": "This run has no user.",
                "finishedAt": _now(),
            }
        )
        return

    log = RunLog(run_id, user_id)
    print(f"Checking {run_id}")
    try:
        end = _parsed(claimed.get("checkAfter"))
        before = _stored_visitors(claimed.get("before"))
        change = _stored_change(claimed.get("plan"))
        pr_url = str(claimed.get("pullRequestUrl") or "")
        if end is None or not before or not change or not pr_url.startswith("https://"):
            raise Incomplete(
                "This run is missing the saved plan, baseline, or pull request."
            )
        after = load_window(user_id, end - timedelta(days=7), end)
        if after is None:
            raise Incomplete(NOT_CONNECTED)
        settle_live(user_id, log, before, after, change, pr_url)
    except Incomplete as error:
        log.fail(str(error))
    except Exception as error:
        text = str(error).strip() or "The check failed. The next check will try again."
        if _fatal(text):
            log.fail(text)
            return
        log.release_measuring(text)


def _claim(client, run_id: str) -> dict | None:
    ref = client.collection("runs").document(run_id)
    transaction = client.transaction()

    @firestore.transactional
    def update(transaction, run_ref):
        snap = run_ref.get(transaction=transaction)
        data = snap.to_dict() if snap.exists else None
        if not _candidate(data or {}, datetime.now(timezone.utc)):
            return None
        transaction.update(run_ref, {"status": "running", "error": "", "checkingAt": _now()})
        return data

    return update(transaction, ref)


def _candidate(data: dict, now: datetime) -> bool:
    if data.get("case") != "live":
        return False
    end = _parsed(data.get("checkAfter"))
    if end is None or end > now:
        return False
    status = data.get("status")
    if status == "measuring":
        return True
    if status != "running":
        return False
    started = _parsed(data.get("checkingAt"))
    return started is not None and now - started >= STALE_AFTER


def _parsed(value: object) -> datetime | None:
    if isinstance(value, datetime):
        when = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return when.astimezone(timezone.utc)
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        when = datetime.fromisoformat(value.strip())
    except ValueError:
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return when.astimezone(timezone.utc)


def _fatal(text: str) -> bool:
    if text == WAIT_MESSAGE:
        return False
    return any(piece in text for piece in _FATAL)


if __name__ == "__main__":
    main()
