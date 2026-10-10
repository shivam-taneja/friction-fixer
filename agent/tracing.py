"""neatlogs setup. One round of the loop is one trace."""

import os
from pathlib import Path

import neatlogs
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")


def init_tracing() -> None:
    """Start neatlogs. Reads NEATLOGS_API_KEY from the environment."""
    neatlogs.init(
        api_key=os.getenv("NEATLOGS_API_KEY"),
        endpoint="https://ingest.neatlogs.com",
        workflow_name="friction-fix-round",
    )


def flush_tracing() -> None:
    """Send any pending spans before the process exits."""
    neatlogs.flush(timeout_millis=10_000)
    neatlogs.shutdown(timeout_millis=10_000)
