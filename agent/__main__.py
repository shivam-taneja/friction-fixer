"""Entry point: python -m agent"""

from agent.loop import run
from agent.tracing import flush_tracing, init_tracing

if __name__ == "__main__":
    init_tracing()

    try:
        run()
    finally:
        flush_tracing()
