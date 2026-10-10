"""Limits and paths for one run of the loop."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEMO_SITE_DIR = REPO_ROOT / "demo-site"

# Stop after this many Analyst → Reviewer rounds.
MAX_ROUNDS = 5

# KEEP when bounce rate falls by at least this many percentage points.
BOUNCE_RATE_DROP = 0.05
