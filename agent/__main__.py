"""Entry point: python -m agent increased|decreased"""

import argparse

from agent.loop import run
from agent.tracing import flush_tracing, init_tracing


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run one local round. The case chooses the mock result after the edit."
    )
    parser.add_argument("case", choices=["increased", "decreased"])
    args = parser.parse_args()

    init_tracing()
    try:
        run(args.case)
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
