"""Plan text shared by the edit prompt and the pull request."""

import re

from agent.schemas import Plan


def plan_text(plan: Plan) -> str:
    return "\n".join(
        [
            f"problem:          {plan.problem}",
            f"evidence:         {plan.evidence}",
            f"change:           {plan.change}",
            f"file:             {plan.file}",
            f"expected effect:  {plan.expected_effect}",
        ]
    )


def subject(change: str) -> str:
    title = re.sub(r"\s+", " ", change).strip()
    if len(title) > 72:
        return title[:69].rstrip() + "..."
    return title
