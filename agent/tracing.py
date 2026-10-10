"""neatlogs setup. One round of the loop is one trace."""


def init_tracing() -> None:
    """Start neatlogs. Reads NEATLOGS_API_KEY from the environment."""
    raise NotImplementedError


def flush_tracing() -> None:
    """Send any pending spans before the process exits."""
    raise NotImplementedError
