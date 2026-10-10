"""One round: Analyst, Builder, merge and deploy, Reviewer. Then repeat."""

from agent.config import MAX_ROUNDS


def run(rounds: int = MAX_ROUNDS) -> None:
    """Run the loop until rounds is reached or bounce rate hits the goal."""
    raise NotImplementedError
