"""HTTP entry for the website. One request starts one run."""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from hmac import compare_digest
from threading import Thread

import neatlogs

from agent.builder.sandbox import demand_message
from agent.loop import run
from agent.simulator.generate import CASES
from agent.tracing import init_tracing


def main() -> None:
    init_tracing()
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Listening on {port}")
    server.serve_forever()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        path = _path(self.path)
        if path == "/capacity":
            if not _authorized(self.headers.get("Authorization", "")):
                self._send(401, {"error": "Unauthorized."})
                return
            message = demand_message()
            if message:
                self._send(429, {"error": message})
                return
            self._send(200, {"ok": True})
            return
        if path != "/":
            self._send(404, {"error": "Not found."})
            return
        self._send(200, {"ok": True})

    def do_POST(self) -> None:
        if _path(self.path) != "/runs":
            self._send(404, {"error": "Not found."})
            return
        if not _authorized(self.headers.get("Authorization", "")):
            self._send(401, {"error": "Unauthorized."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            body = json.loads(raw.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._send(400, {"error": "Send JSON with runId, userId, and case."})
            return

        run_id = body.get("runId") if isinstance(body, dict) else None
        user_id = body.get("userId") if isinstance(body, dict) else None
        case = body.get("case") if isinstance(body, dict) else None
        if (
            not isinstance(run_id, str)
            or not run_id.strip()
            or not isinstance(user_id, str)
            or not user_id.strip()
            or case not in CASES
        ):
            self._send(400, {"error": "Send runId, userId, and case."})
            return

        message = demand_message()
        if message:
            self._send(429, {"error": message})
            return

        Thread(
            target=_serve_run,
            args=(case, user_id.strip(), run_id.strip()),
            daemon=True,
        ).start()
        self._send(202, {"ok": True})

    def _send(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} {fmt % args}")


def _serve_run(case: str, user_id: str, run_id: str) -> None:
    try:
        run(case, user_id, run_id)
    except Exception as error:
        print(error)
    finally:
        neatlogs.flush(timeout_millis=10_000)


def _authorized(header: str) -> bool:
    secret = os.getenv("AGENT_SECRET", "").strip()
    token = header.removeprefix("Bearer ").strip()
    if not secret or not header.startswith("Bearer "):
        return False
    return compare_digest(token, secret)


def _path(raw: str) -> str:
    return raw.split("?", 1)[0]


if __name__ == "__main__":
    main()
