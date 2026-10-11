"""Limits and paths for one run of the loop."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Stop after this many Analyst → Reviewer rounds. The live path does not use this.
MAX_ROUNDS = 5

# KEEP when bounce rate falls by at least this many percentage points.
BOUNCE_RATE_DROP = 0.05

# How long a live run waits before PostHog is read again.
# The saved value is on the user. These bounds match Settings.
CHECK_AFTER_MIN_HOURS = 1
CHECK_AFTER_MAX_HOURS = 14 * 24
CHECK_AFTER_DEFAULT_HOURS = 7 * 24
