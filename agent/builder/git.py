"""Commits the edit, pushes the branch, and opens the pull request."""

import os
import re
import subprocess
import time
from pathlib import Path

from agent.builder.github_app import github_json
from agent.config import REPO_ROOT


def require_clean_tree() -> None:
    status = run(["git", "status", "--porcelain"])
    if status:
        raise RuntimeError(
            "Commit or stash the current changes first. A test pull request should contain only the new edit."
        )


def current_point() -> str:
    """Branch name, or the commit id when the checkout has no branch.

    Render checks out a commit with no branch, so the branch name is blank.
    """
    branch = run(["git", "branch", "--show-current"])
    if branch:
        return branch
    return run(["git", "rev-parse", "HEAD"])


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
    if not name.strip():
        raise RuntimeError("There is no branch or commit to switch back to.")
    run(["git", "checkout", name])


def commit_files(paths: list[Path], title: str, body: str) -> None:
    relative = [str(path.relative_to(REPO_ROOT)) for path in paths]
    run(["git", "add", "--", *relative])

    if not run(["git", "diff", "--cached", "--name-only"]):
        raise RuntimeError("The model made no visible change.")

    run(
        [
            "git",
            "-c",
            "user.email=friction-fixer@users.noreply.github.com",
            "-c",
            "user.name=Friction Fixer",
            "commit",
            "-m",
            title,
            "-m",
            body,
        ]
    )


def delete_branch(name: str) -> None:
    subprocess.run(
        ["git", "branch", "-d", name],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )


def prepare_remote(repository: str) -> None:
    """Point origin at the project's GitHub repo.

    Render's checkout has no usable origin, so push names a remote that is not a repo.
    """
    url = _https_url(repository)
    probe = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if probe.returncode == 0:
        run(["git", "remote", "set-url", "origin", url])
        return
    run(["git", "remote", "add", "origin", url])


def push(branch: str, token: str) -> None:
    _authed(["push", "-u", "origin", branch], token)


class NeedsPerson(Exception):
    """The pull request needs a person. The agent does not pull or resolve conflicts."""

    def __init__(
        self, message: str, pull_request_url: str = "", *, undo: bool = False
    ) -> None:
        super().__init__(message)
        self.pull_request_url = pull_request_url
        self.undo = undo


_CONFLICT = (
    "This pull request has a conflict. Resolve it on GitHub, then continue the run. "
    "The agent will not pull or rewrite the branch."
)
_BEHIND = (
    "This branch is behind the base branch and GitHub will not merge it. "
    "Update the branch on GitHub, then continue the run. The agent will not pull."
)
_WAITING = (
    "GitHub will not merge this pull request yet. Finish that on GitHub, then continue the run. "
    "The agent will not pull."
)


def merge_pr(url: str, token: str, repository: str) -> None:
    """Merge a pull request so the site can go live.

    A conflict or a branch GitHub refuses to merge is left for a person.
    """
    number = _pull_number(url)
    pull = _wait_for_mergeable(repository, number, token)
    if pull.get("merged") is True:
        return
    reason = _handoff_reason(pull)
    if reason:
        raise NeedsPerson(reason, url)
    try:
        github_json(
            "PUT",
            f"/repos/{repository}/pulls/{number}/merge",
            token,
            {"merge_method": "merge"},
        )
    except RuntimeError as error:
        text = str(error).lower()
        if "not mergeable" in text or "conflict" in text:
            fresh = github_json("GET", f"/repos/{repository}/pulls/{number}", token)
            if fresh.get("merged") is True:
                return
            reason = _handoff_reason(fresh) or _CONFLICT
            raise NeedsPerson(reason, url) from error
        raise


def revert_pr(url: str, reason: str, token: str, repository: str, base: str) -> str:
    """Open a new pull request that undoes a merged one, and return its URL."""
    number = _pull_number(url)
    pull = github_json("GET", f"/repos/{repository}/pulls/{number}", token)
    sha = pull.get("merge_commit_sha")
    if not isinstance(sha, str) or not sha:
        raise RuntimeError("The pull request has no merge commit to undo.")

    original = current_point()
    branch = _fresh_branch(f"undo/{number}")
    _authed(["fetch", "origin", base], token)
    run(["git", "checkout", "-b", branch, f"origin/{base}"])
    try:
        try:
            run(
                [
                    "git",
                    "-c",
                    "user.email=friction-fixer@users.noreply.github.com",
                    "-c",
                    "user.name=Friction Fixer",
                    "revert",
                    "-m",
                    "1",
                    "--no-edit",
                    sha,
                ]
            )
        except RuntimeError as error:
            _abort_revert()
            if "conflict" in str(error).lower():
                raise NeedsPerson(
                    f"The undo hit a conflict on {url}. Resolve it on GitHub, then continue the run. "
                    "The agent will not pull.",
                    undo=True,
                ) from error
            raise
        push(branch, token)
        return open_pr(branch, base, "Undo the last change", reason, token, repository)
    finally:
        try:
            if current_point() != original:
                checkout(original)
        except Exception as error:
            print(f"Could not return to the starting checkout: {error}")


def open_pr(
    branch: str, base: str, title: str, body: str, token: str, repository: str
) -> str:
    created = github_json(
        "POST",
        f"/repos/{repository}/pulls",
        token,
        {"title": title, "head": branch, "base": base, "body": body},
    )
    url = created.get("html_url")
    if not isinstance(url, str) or not url.startswith("https://"):
        raise RuntimeError("GitHub did not return a pull request URL.")
    return url


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


def _authed(args: list[str], token: str) -> None:
    run(
        [
            "git",
            "-c",
            "credential.helper=",
            "-c",
            'credential.helper=!f() { echo "username=x-access-token"; echo "password=$GIT_PASSWORD"; }; f',
            *args,
        ],
        env=_github_env(token),
    )


def _wait_for_mergeable(repository: str, number: str, token: str) -> dict:
    pull: dict = {}
    for attempt in range(4):
        pull = github_json("GET", f"/repos/{repository}/pulls/{number}", token)
        if pull.get("merged") is True or pull.get("mergeable") is not None:
            return pull
        if attempt < 3:
            time.sleep(2)
    return pull


def _handoff_reason(pull: dict) -> str:
    if pull.get("merged") is True or pull.get("mergeable") is True:
        return ""
    state = str(pull.get("mergeable_state") or "")
    if state == "dirty":
        return _CONFLICT
    if state == "behind":
        return _BEHIND
    if pull.get("mergeable") is False:
        return _WAITING
    return ""


def _abort_revert() -> None:
    subprocess.run(
        ["git", "revert", "--abort"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )


def _pull_number(url: str) -> str:
    match = re.search(r"/pull/(\d+)", url)
    if not match:
        raise RuntimeError("The pull request URL has no number.")
    return match.group(1)


def _fresh_branch(base: str) -> str:
    name = base
    number = 2
    while _branch_exists(name):
        name = f"{base}-{number}"
        number += 1
    return name


def _https_url(repository: str) -> str:
    owner, _, name = repository.partition("/")
    if not owner or not name or "/" in name or " " in repository:
        raise RuntimeError("The project repository must look like owner/name.")
    return f"https://github.com/{owner}/{name}.git"


def _github_env(token: str) -> dict[str, str]:
    token = token.strip()
    if not token:
        raise RuntimeError("A GitHub installation token is required.")
    env = os.environ.copy()
    env["GIT_PASSWORD"] = token
    env["GIT_TERMINAL_PROMPT"] = "0"
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
