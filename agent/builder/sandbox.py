"""Opens a short-lived Daytona sandbox and clones the user's repo into it."""

import os
from dataclasses import dataclass

from agent.project import Project

REPO_DIR = "repo"


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


def _client():
    from daytona import Daytona

    return Daytona()
