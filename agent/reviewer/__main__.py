"""Entry point: python -m agent.reviewer increased|decreased"""

import argparse

from agent.reviewer import review_case, verdict_text
from agent.tracing import flush_tracing, init_tracing


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ask the simulator for one mock outcome, then judge it."
    )
    parser.add_argument("case", choices=["increased", "decreased"])
    args = parser.parse_args()

    init_tracing()
    try:
        print(verdict_text(review_case(args.case)))
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
