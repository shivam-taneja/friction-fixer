"""One round: Analyst, Builder, merge and deploy, Reviewer. Then repeat."""

import neatlogs

from agent.config import MAX_ROUNDS


@neatlogs.span(kind="WORKFLOW", name="friction-fix-round")
def run(rounds: int = MAX_ROUNDS) -> None:
    """Run the loop until rounds is reached or bounce rate hits the goal."""
    raise NotImplementedError
