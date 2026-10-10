"""Applies the plan inside demo-site/ only, then opens a pull request."""

from agent.schemas import Plan


def apply_plan(plan: Plan) -> str:
    """Edit the file named in the plan, commit, open a PR, and return the PR URL.

    The PR description includes the plan. No files outside demo-site/ are edited.
    """
    raise NotImplementedError
