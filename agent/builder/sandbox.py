"""Opens a short-lived Daytona sandbox and clones the user's repo into it."""

import os
from dataclasses import dataclass

from agent.project import Project

REPO_DIR = "repo"
SANDBOX_LIMIT = 2
WAIT_MESSAGE = "Too much demand right now. Please wait a little and try again."
_IDLE = {
    "stopped",
    "archived",
    "destroyed",
    "deleted",
    "error",
    "build_failed",
}


@dataclass
class RepoSandbox:
    sandbox: object
    path: str

    def delete(self) -> None:
        _client().delete(self.sandbox)


def open_repo(project: Project, token: str) -> RepoSandbox:
    """Create a sandbox, clone the saved branch, and return it.

    The caller deletes the sandbox when the pull request is open.
    """
    if not os.getenv("DAYTONA_API_KEY", "").strip():
        raise RuntimeError(
            "Set DAYTONA_API_KEY in agent/.env before opening a sandbox."
        )

    token = token.strip()
    if not token:
        raise RuntimeError("A GitHub token is required to clone the repo.")

    owner, name = project.repository.split("/", 1)
    daytona = _client()
    sandbox = daytona.create()
    try:
        sandbox.git.clone(
            url=f"https://github.com/{owner}/{name}.git",
            path=REPO_DIR,
            branch=project.branch,
            username="x-access-token",
            password=token,
        )
    except Exception:
        daytona.delete(sandbox)
        raise

    return RepoSandbox(sandbox=sandbox, path=REPO_DIR)


def demand_message() -> str | None:
    """Refuse a new run when two or more Daytona sandboxes are still open."""
    if not os.getenv("DAYTONA_API_KEY", "").strip():
        return None
    try:
        count = _open_count()
    except Exception:
        return WAIT_MESSAGE
    if count >= SANDBOX_LIMIT:
        return WAIT_MESSAGE
    return None


def _open_count() -> int:
    count = 0
    for sandbox in _client().list():
        state = getattr(sandbox, "state", None)
        name = str(getattr(state, "value", state) or "").lower()
        if name not in _IDLE:
            count += 1
    return count


def _client():
    from daytona import Daytona

    return Daytona()
