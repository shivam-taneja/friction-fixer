"""Opens and merges pull requests on GitHub."""

import re
import time

from agent.builder.github_app import github_json


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
    if pull.get("state") == "closed":
        raise RuntimeError(
            "This pull request was closed, so this run cannot continue. Start a new run."
        )
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
            if fresh.get("state") == "closed":
                raise RuntimeError(
                    "This pull request was closed, so this run cannot continue. Start a new run."
                ) from error
            reason = _handoff_reason(fresh) or _CONFLICT
            raise NeedsPerson(reason, url) from error
        raise


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


def _pull_number(url: str) -> str:
    match = re.search(r"/pull/(\d+)", url)
    if not match:
        raise RuntimeError("The pull request URL has no number.")
    return match.group(1)
