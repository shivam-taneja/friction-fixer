"""Entry point: python -m agent.builder"""

import argparse

from agent.builder import apply_plan
from agent.schemas import Plan
from agent.tracing import flush_tracing, init_tracing


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


def _open_test_pr(change: str) -> str:
    plan = Plan(
        problem="Manual test of the Builder.",
        evidence="No visitor data. This run is a direct request.",
        change=change,
        file="demo-site/",
        expected_effect="The page shows the requested change.",
    )
    return apply_plan(plan)


if __name__ == "__main__":
    main()
