"""Writes one run's steps to Firestore so the website can show them."""

from datetime import datetime, timezone

from agent.project import _client

_ACTIVE = {"queued", "running"}


class RunLog:
    def __init__(self, run_id: str, user_id: str) -> None:
        self.run_id = run_id.strip()
        self.user_id = user_id.strip()
        self.client = _client()

    def start(self, case: str) -> None:
        snap = self._run().get()
        data = snap.to_dict() if snap.exists else None
        if not data or data.get("userId") != self.user_id:
            raise RuntimeError("This run does not belong to that user.")
        if data.get("case") != case:
            raise RuntimeError("The run case does not match.")
        if data.get("status") not in _ACTIVE:
            raise RuntimeError("This run already finished.")
        self._run().update({"status": "running", "startedAt": _now(), "error": ""})

    def step(self, step_id: str, title: str, detail: str, extra: dict | None = None) -> None:
        self._refuse_if_stopped()
        print(f"--- {title} ---\n{detail}")
        payload: dict = {
            f"steps.{step_id}": {"title": title, "detail": detail, "at": _now()},
        }
        if extra:
            payload.update(extra)
        self._run().update(payload)

    def block(
        self,
        message: str,
        step_id: str,
        title: str,
        detail: str,
        extra: dict | None = None,
    ) -> None:
        """Pause for a person. The run stays locked until they continue it."""
        print(f"--- waiting ---\n{message}")
        self.step(step_id, title, detail, extra)
        self._run().update({"status": "blocked", "error": message})

    def resume(self) -> dict:
        snap = self._run().get()
        data = snap.to_dict() if snap.exists else None
        if not data or data.get("userId") != self.user_id:
            raise RuntimeError("This run does not belong to that user.")
        if data.get("status") != "blocked":
            raise RuntimeError("This run is not waiting for a person.")
        self._run().update({"status": "running", "error": ""})
        return data

    def mark_measuring(self) -> None:
        """The change is live. A later check reads PostHog. The lock stays."""
        self._refuse_if_stopped()
        self._run().update({"status": "measuring", "error": ""})

    def finish(self, status: str) -> None:
        self._refuse_if_stopped()
        self._run().update({"status": status, "finishedAt": _now(), "error": ""})
        self._clear_lock()

    def fail(self, message: str) -> None:
        print(f"--- stopped ---\n{message}")
        try:
            current = self._run().get()
            status = (current.to_dict() or {}).get("status") if current.exists else None
            if status in {"kept", "undone", "failed"}:
                self._clear_lock()
                return
            self._run().update(
                {
                    "status": "failed",
                    "error": message,
                    "finishedAt": _now(),
                    "steps.action": {
                        "title": "Stopped",
                        "detail": message,
                        "at": _now(),
                    },
                }
            )
            self._clear_lock()
        except Exception as error:
            print(error)

    def _run(self):
        return self.client.collection("runs").document(self.run_id)

    def _refuse_if_stopped(self) -> None:
        snap = self._run().get()
        data = snap.to_dict() if snap.exists else None
        if not data or data.get("status") != "failed":
            return
        message = data.get("error")
        if isinstance(message, str) and message.strip():
            raise RuntimeError(message.strip())
        raise RuntimeError("This run was stopped.")

    def _clear_lock(self) -> None:
        user_ref = self.client.collection("users").document(self.user_id)
        snap = user_ref.get()
        if snap.exists and (snap.to_dict() or {}).get("activeRunId") == self.run_id:
            user_ref.update({"activeRunId": None})


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
