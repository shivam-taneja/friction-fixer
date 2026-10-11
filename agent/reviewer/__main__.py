"""Entry point: python -m agent.reviewer increased|decreased"""

import argparse

from agent.reviewer import load_case, review, verdict_text
from agent.tracing import flush_tracing, init_tracing


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Judge one mock before/after result."
    )
    parser.add_argument("case", choices=["increased", "decreased"])
    args = parser.parse_args()

    init_tracing()
    try:
        change, before, after = load_case(args.case)
        print(verdict_text(review(change, before, after)))
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
