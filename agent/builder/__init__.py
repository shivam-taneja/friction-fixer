"""Applies one change inside the project's source folder and opens a pull request."""

from pathlib import Path

import neatlogs

from agent.builder import git
from agent.builder.edit import edit_site, provider_settings
from agent.builder.sandbox import RepoSandbox
from agent.builder.text import plan_text, subject
from agent.project import Project
from agent.schemas import Plan


@neatlogs.span(kind="AGENT", name="builder")
def apply_plan(
    plan: Plan, project: Project, token: str, box: RepoSandbox, repo: Path
) -> str:
    """Edit the cloned repository, push a branch, and return the pull request URL."""
    provider_settings()
    written = edit_site(plan, project, repo)
    branch = box.publish(repo, written, subject(plan.change), plan_text(plan), token)
    return git.open_pr(
        branch,
        project.branch,
        subject(plan.change),
        plan_text(plan),
        token,
        project.repository,
    )
