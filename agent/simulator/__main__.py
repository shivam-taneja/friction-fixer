"""Entry point: python -m agent.simulator"""

from agent.analyst.events import load_visitors
from agent.simulator.generate import (
    CASES,
    DEFAULT_CHANGE,
    fixture_path,
    generate_outcomes,
)
from agent.tracing import flush_tracing, init_tracing


def main() -> None:
    init_tracing()
    try:
        before = load_visitors()
        outcomes = generate_outcomes(DEFAULT_CHANGE, before)
        for case in CASES:
            after = outcomes[case]
            print(
                f"{case}: bounce {before.bounce_rate:.0%} -> {after.bounce_rate:.0%} "
                f"({fixture_path(case).as_posix()})"
            )
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
