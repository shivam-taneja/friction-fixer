"""Applies one change inside demo-site/ and opens a pull request."""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

import neatlogs
from openai import OpenAI

from agent.config import DEMO_SITE_DIR, REPO_ROOT
from agent.schemas import Plan
from agent.tracing import flush_tracing, init_tracing

TEXT_SUFFIXES = {".html", ".css", ".js", ".svg", ".txt", ".md"}
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


@neatlogs.span(kind="AGENT", name="builder")
def apply_plan(plan: Plan) -> str:
    """Edit the file named in the plan, commit, open a PR, and return the PR URL.

    The PR description includes the plan. No files outside demo-site/ are edited.
    """
    _require_keys()
    _require_clean_tree()

    original = _git(["git", "branch", "--show-current"])
    branch = _branch_name(plan.change)
    written: list[Path] = []
    committed = False

    _git(["git", "checkout", "-b", branch])
    try:
        written = _edit_site(plan)
        relative = [str(path.relative_to(REPO_ROOT)) for path in written]
        _git(["git", "add", "--", *relative])
        if not _git(["git", "diff", "--cached", "--name-only"]):
            raise RuntimeError("The model made no visible change.")
        _git(["git", "commit", "-m", _subject(plan.change), "-m", _plan_text(plan)])
        committed = True
        _push(branch)
        return _open_pr(branch, _subject(plan.change), _plan_text(plan))
    except Exception:
        if not committed:
            _restore(written)
        raise
    finally:
        if _git(["git", "branch", "--show-current"]) != original:
            _git(["git", "checkout", original])
        if not committed:
            subprocess.run(
                ["git", "branch", "-d", branch],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )


def _edit_site(plan: Plan) -> list[Path]:
    current = _read_site()
    client = neatlogs.wrap(
        OpenAI(
            api_key=os.environ["GROQ_API_KEY"].strip(),
            base_url=GROQ_BASE_URL,
        )
    )
    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You edit a static site. Return JSON only, with the shape "
                    '{"files":[{"path":"demo-site/style.css","content":"full file"}]}. '
                    "Include the full new contents of each file you change. "
                    "Change only what the plan asks for. "
                    "Every path must stay inside demo-site/."
                ),
            },
            {
                "role": "user",
                "content": _plan_text(plan) + "\n\nCurrent files:\n\n" + current,
            },
        ],
    )
    text = response.choices[0].message.content or ""
    written: list[Path] = []
    for item in _parse_files(text):
        path = _site_path(str(item.get("path", "")), plan)
        content = item.get("content")
        if not isinstance(content, str) or content == "":
            raise RuntimeError(f"The model returned empty contents for {path.name}.")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        written.append(path)
    if not written:
        raise RuntimeError("The model did not change any files.")
    return written


def _read_site() -> str:
    parts: list[str] = []
    for path in _site_files():
        relative = path.relative_to(REPO_ROOT).as_posix()
        parts.append(f"--- {relative} ---\n{path.read_text()}")
    return "\n\n".join(parts)


def _site_files() -> list[Path]:
    if not DEMO_SITE_DIR.exists():
        raise RuntimeError("demo-site/ does not exist yet.")
    files = [
        path
        for path in sorted(DEMO_SITE_DIR.rglob("*"))
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES
    ]
    if not files:
        raise RuntimeError("demo-site/ has no pages to edit.")
    return files


def _parse_files(text: str) -> list[dict]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError("The model did not return JSON.") from error
    files = data.get("files") if isinstance(data, dict) else None
    if not isinstance(files, list) or not files:
        raise RuntimeError("The model did not return any files to change.")
    return [item for item in files if isinstance(item, dict)]


def _site_path(raw: str, plan: Plan) -> Path:
    raw = raw.strip().replace("\\", "/")
    if not raw or raw.startswith("/"):
        raise RuntimeError(f"Refusing path: {raw}")
    relative = raw if raw.startswith("demo-site/") else f"demo-site/{raw}"
    path = (REPO_ROOT / relative).resolve()
    demo = DEMO_SITE_DIR.resolve()
    if path != demo and demo not in path.parents:
        raise RuntimeError(f"Refusing a file outside demo-site: {raw}")
    allowed = _allowed_files(plan)
    if allowed is not None and path not in allowed:
        raise RuntimeError(f"The plan does not allow editing {relative}.")
    return path


def _allowed_files(plan: Plan) -> set[Path] | None:
    raw = plan.file.strip().replace("\\", "/")
    if raw in {"demo-site", "demo-site/"}:
        return None
    allowed: set[Path] = set()
    for part in raw.split(" and "):
        part = part.strip()
        if not part:
            continue
        path = (REPO_ROOT / part).resolve()
        allowed.add(path)
    return allowed or None


def _require_keys() -> None:
    if not os.getenv("GROQ_API_KEY", "").strip():
        raise RuntimeError("Set GROQ_API_KEY in .env before running the Builder.")
    if not os.getenv("GITHUB_TOKEN", "").strip():
        raise RuntimeError("Set GITHUB_TOKEN in .env before running the Builder.")


def _require_clean_tree() -> None:
    status = _git(["git", "status", "--porcelain"])
    if status:
        raise RuntimeError(
            "Commit or stash the current changes first. A test pull request should contain only the new edit."
        )


def _branch_name(change: str) -> str:
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


def _branch_exists(name: str) -> bool:
    result = subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", f"refs/heads/{name}"],
        cwd=REPO_ROOT,
    )
    return result.returncode == 0


def _subject(change: str) -> str:
    subject = re.sub(r"\s+", " ", change).strip()
    if len(subject) > 72:
        return subject[:69].rstrip() + "..."
    return subject


def _plan_text(plan: Plan) -> str:
    return "\n".join(
        [
            f"problem:          {plan.problem}",
            f"evidence:         {plan.evidence}",
            f"change:           {plan.change}",
            f"file:             {plan.file}",
            f"expected effect:  {plan.expected_effect}",
        ]
    )


def _push(branch: str) -> None:
    token = os.environ["GITHUB_TOKEN"].strip()
    env = os.environ.copy()
    env["GITHUB_TOKEN"] = token
    env["GH_TOKEN"] = token
    env["GIT_TERMINAL_PROMPT"] = "0"
    _git(
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


def _open_pr(branch: str, title: str, body: str) -> str:
    token = os.environ["GITHUB_TOKEN"].strip()
    env = os.environ.copy()
    env["GITHUB_TOKEN"] = token
    env["GH_TOKEN"] = token
    return _git(
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


def _restore(paths: list[Path]) -> None:
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


def _git(cmd: list[str], env: dict[str, str] | None = None) -> str:
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


def _open_test_pr(change: str) -> str:
    plan = Plan(
        problem="Manual test of the Builder.",
        evidence="No visitor data. This run is a direct request.",
        change=change,
        file="demo-site/",
        expected_effect="The page shows the requested change.",
    )
    return apply_plan(plan)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Edit demo-site and open a pull request."
    )
    parser.add_argument(
        "change",
        help='One change, for example: "Make the pricing button large and green"',
    )
    args = parser.parse_args()
    init_tracing()
    try:
        print(_open_test_pr(args.change))
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
