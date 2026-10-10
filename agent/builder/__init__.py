"""Applies one change inside demo-site/ and opens a pull request."""

import os
from pathlib import Path

import neatlogs

from agent.builder import git
from agent.builder.edit import edit_site
from agent.builder.text import plan_text, subject
from agent.schemas import Plan


@neatlogs.span(kind="AGENT", name="builder")
def apply_plan(plan: Plan) -> str:
    """Edit the file named in the plan, commit, open a PR, and return the PR URL.

    The PR description includes the plan. No files outside demo-site/ are edited.
    """
    _require_keys()
    git.require_clean_tree()

    original = git.current_branch()
    branch = git.branch_name(plan.change)
    written: list[Path] = []
    committed = False

    git.checkout_new_branch(branch)
    try:
        written = edit_site(plan)
        git.commit_files(written, subject(plan.change), plan_text(plan))
        committed = True
        git.push(branch)
        return git.open_pr(branch, subject(plan.change), plan_text(plan))
    except Exception:
        if not committed:
            git.restore(written)
        raise
    finally:
        if git.current_branch() != original:
            git.checkout(original)
        if not committed:
            git.delete_branch(branch)


def _require_keys() -> None:
    if not os.getenv("GROQ_API_KEY", "").strip():
        raise RuntimeError("Set GROQ_API_KEY in .env before running the Builder.")
    if not os.getenv("GITHUB_TOKEN", "").strip():
        raise RuntimeError("Set GITHUB_TOKEN in .env before running the Builder.")
