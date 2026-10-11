"""Mints a short-lived GitHub App installation token for git and pull requests."""

import base64
import json
import os
import time
import urllib.error
import urllib.request

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def github_json(
    method: str, path: str, token: str, payload: dict | None = None
) -> dict:
    """Call the GitHub API with an installation token."""
    body = _github_body(method, path, token, payload)
    if not isinstance(body, dict):
        raise RuntimeError("GitHub returned an unexpected response.")
    return body


def github_list(path: str, token: str) -> list:
    """Call a GitHub API route that returns a list."""
    body = _github_body("GET", path, token, None)
    if not isinstance(body, list):
        raise RuntimeError("GitHub returned an unexpected response.")
    return body


def installation_token(installation_id: int) -> str:
    """Ask GitHub for a token that can push and open pull requests for this install."""
    if installation_id <= 0:
        raise RuntimeError("The project is missing installationId.")

    request = urllib.request.Request(
        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
        data=b"{}",
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {_app_jwt()}",
            "User-Agent": "friction-fixer",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        message = _github_message(detail) or error.reason
        raise RuntimeError(
            "GitHub refused an installation token. "
            "The app needs Contents and Pull requests set to Read and write. "
            f"{message}"
        ) from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"GitHub could not be reached. {error.reason}") from error

    token = body.get("token") if isinstance(body, dict) else None
    if not isinstance(token, str) or not token.strip():
        raise RuntimeError("GitHub did not return an installation token.")
    return token.strip()


def _app_jwt() -> str:
    app_id = os.getenv("GITHUB_APP_ID", "").strip()
    private_key = _private_key(os.getenv("GITHUB_APP_PRIVATE_KEY", ""))
    if not app_id or "BEGIN" not in private_key:
        raise RuntimeError(
            "Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY on the agent. "
            "Use the same values as the website."
        )

    now = int(time.time())
    header = _b64(
        json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")).encode()
    )
    payload = _b64(
        json.dumps(
            {"iat": now - 60, "exp": now + 9 * 60, "iss": app_id},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode()
    key = serialization.load_pem_private_key(private_key.encode(), password=None)
    signature = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    return f"{header}.{payload}.{_b64(signature)}"


def _private_key(raw: str) -> str:
    key = raw.strip()
    if (key.startswith('"') and key.endswith('"')) or (
        key.startswith("'") and key.endswith("'")
    ):
        key = key[1:-1]
    return key.replace("\\n", "\n")


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _github_body(
    method: str, path: str, token: str, payload: dict | None
) -> dict | list:
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(
        f"https://api.github.com{path}",
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token.strip()}",
            "User-Agent": "friction-fixer",
            "X-GitHub-Api-Version": "2022-11-28",
            **({"Content-Type": "application/json"} if data is not None else {}),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode()
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        message = _github_message(detail) or error.reason
        raise RuntimeError(f"GitHub refused the request. {message}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"GitHub could not be reached. {error.reason}") from error

    if not raw.strip():
        return {}
    body = json.loads(raw)
    if isinstance(body, (dict, list)):
        return body
    raise RuntimeError("GitHub returned an unexpected response.")


def _github_message(raw: str) -> str:
    try:
        body = json.loads(raw)
    except json.JSONDecodeError:
        return raw.strip()
    message = body.get("message") if isinstance(body, dict) else None
    return message.strip() if isinstance(message, str) else ""
