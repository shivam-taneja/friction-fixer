"""Commits the edit, pushes the branch, and opens the pull request."""

import os
import re
import subprocess
from pathlib import Path

from agent.config import REPO_ROOT


def require_clean_tree() -> None:
    status = run(["git", "status", "--porcelain"])
    if status:
        raise RuntimeError(
            "Commit or stash the current changes first. A test pull request should contain only the new edit."
        )


def current_branch() -> str:
    return run(["git", "branch", "--show-current"])


def branch_name(change: str) -> str:
    slug = (
        re.sub(r"[^a-z0-9]+", "-", change.lower()).strip("-")[:40].strip("-")
        or "change"
    )
    base = f"builder/{slug}"
    name = base
    number = 2

    while _branch_exists(name):
        name = f"{base}-{number}"
        number += 1

    return name


def checkout_new_branch(name: str) -> None:
    run(["git", "checkout", "-b", name])


def checkout(name: str) -> None:
    run(["git", "checkout", name])


def commit_files(paths: list[Path], title: str, body: str) -> None:
    relative = [str(path.relative_to(REPO_ROOT)) for path in paths]
    run(["git", "add", "--", *relative])

    if not run(["git", "diff", "--cached", "--name-only"]):
        raise RuntimeError("The model made no visible change.")

    run(["git", "commit", "-m", title, "-m", body])


def delete_branch(name: str) -> None:
    subprocess.run(
        ["git", "branch", "-d", name],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )


def push(branch: str) -> None:
    token = os.environ["GITHUB_TOKEN"].strip()
    env = os.environ.copy()
    env["GITHUB_TOKEN"] = token
    env["GH_TOKEN"] = token
    env["GIT_TERMINAL_PROMPT"] = "0"

    run(
        [
            "git",
            "-c",
            "credential.helper=",
            "-c",
            'credential.helper=!f() { echo "username=x-access-token"; echo "password=$GITHUB_TOKEN"; }; f',
            "push",
            "-u",
            "origin",
            branch,
        ],
        env=env,
    )


def merge_pr(url: str) -> None:
    """Merge a pull request so the site can go live."""
    run(["gh", "pr", "merge", url, "--merge"], env=_github_env())


def revert_pr(url: str, reason: str) -> str:
    """Open a new pull request that undoes a merged one, and return its URL."""
    return run(
        [
            "gh",
            "pr",
            "revert",
            url,
            "--title",
            "Undo the last change",
            "--body",
            reason,
        ],
        env=_github_env(),
    )


def open_pr(branch: str, title: str, body: str) -> str:
    token = os.environ["GITHUB_TOKEN"].strip()
    env = os.environ.copy()
    env["GITHUB_TOKEN"] = token
    env["GH_TOKEN"] = token

    return run(
        [
            "gh",
            "pr",
            "create",
            "--base",
            "main",
            "--head",
            branch,
            "--title",
            title,
            "--body",
            body,
        ],
        env=env,
    )


def restore(paths: list[Path]) -> None:
    for path in paths:
        relative = str(path.relative_to(REPO_ROOT))
        tracked = subprocess.run(
            ["git", "ls-files", "--error-unmatch", "--", relative],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        if tracked.returncode == 0:
            subprocess.run(
                ["git", "checkout", "--", relative], cwd=REPO_ROOT, capture_output=True
            )
        elif path.exists():
            path.unlink()


def _github_env() -> dict[str, str]:
    token = os.environ["GITHUB_TOKEN"].strip()
    env = os.environ.copy()
    env["GITHUB_TOKEN"] = token
    env["GH_TOKEN"] = token
    return env


def run(cmd: list[str], env: dict[str, str] | None = None) -> str:
    result = subprocess.run(
        cmd,
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
    )

    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"{cmd[0]} failed: {detail}")

    return result.stdout.strip()


def _branch_exists(name: str) -> bool:
    result = subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", f"refs/heads/{name}"],
        cwd=REPO_ROOT,
    )

    return result.returncode == 0
