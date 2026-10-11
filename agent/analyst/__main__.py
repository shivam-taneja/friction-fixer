"""Entry point: python -m agent.analyst"""

from agent.analyst import load_visitors, write_plan
from agent.builder.text import plan_text
from agent.tracing import flush_tracing, init_tracing


def main() -> None:
    init_tracing()
    try:
        visitors = load_visitors()
        print(plan_text(write_plan(visitors, [])))
    finally:
        flush_tracing()


if __name__ == "__main__":
    main()
