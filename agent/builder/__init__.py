"""Applies one change inside the project's source folder and opens a pull request."""

from pathlib import Path

import neatlogs

from agent.builder import git
from agent.builder.edit import edit_site, provider_settings
from agent.builder.text import plan_text, subject
from agent.project import Project
from agent.schemas import Plan


@neatlogs.span(kind="AGENT", name="builder")
def apply_plan(plan: Plan, project: Project, token: str) -> str:
    """Edit inside the project's source folder, commit, open a PR, and return the URL."""
    provider_settings()
    git.prepare_remote(project.repository)
    git.require_clean_tree()

    original = git.current_point()
    branch = git.branch_name(plan.change)
    written: list[Path] = []
    committed = False

    git.checkout_new_branch(branch)

    try:
        written = edit_site(plan, project)
        git.commit_files(written, subject(plan.change), plan_text(plan))
        committed = True
        git.push(branch, token)
        return git.open_pr(
            branch,
            project.branch,
            subject(plan.change),
            plan_text(plan),
            token,
            project.repository,
        )
    except Exception:
        if not committed:
            git.restore(written)
        raise
    finally:
        _return_to_start(original)
        if not committed:
            git.delete_branch(branch)


def _return_to_start(original: str) -> None:
    try:
        if git.current_point() != original:
            git.checkout(original)
    except Exception as error:
        print(f"Could not return to the starting checkout: {error}")

